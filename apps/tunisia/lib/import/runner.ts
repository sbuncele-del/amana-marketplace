import {units} from '../shipper-normalise';
import {BudgetExceeded, ShipperError, type ShipperClient} from './client';
import type {ImportConfig} from './config';
import {indexContent, matchContent, shortId, slugify, type ContentIndex} from './content';
import {decide, type Reason} from './decide';
import {parseMoney} from './pricing';
import type {CatalogueStore, FailureRecord, ItemRecord, ProductRecord} from './store';
export type RunSummary = {
 status: 'complete' | 'paused' | 'busy' | 'failed'; runId: number | null; pagesProcessed: number; discovered: number; failedRows: number;
 markedMissing: number; error?: string;
};
const idPattern = /^[a-zA-Z0-9-]+$/;
const asText = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const generatedSlug = (name: string, uuid: string) => `${slugify(name) || 'product'}-${shortId(uuid)}`;
// Turns one supplier row into a storable record. Bad money or stock becomes a
// "failed" item with a reason; it never becomes a guessed value.
export function mapRow(row: any, index: ContentIndex, config: ImportConfig): {record: ProductRecord | null; failures: FailureRecord[]} {
 const uuid = typeof row?.uuid === 'string' ? row.uuid : '';
 const name = asText(row?.name);
 if (!idPattern.test(uuid) || !name) return {record: null, failures: [{productUuid: idPattern.test(uuid) ? uuid : null, stage: 'parse', reason: 'invalid_row', detail: 'missing uuid or name'}]};
 const failures: FailureRecord[] = [];
 const link = asText(row.link);
 const match = matchContent({uuid, link, name}, index);
 const variants: any[] = Array.isArray(row.variants) && row.variants.length ? row.variants : [null];
 const items: ItemRecord[] = [];
 for (const v of variants) {
  const itemUuid = v?.uuid ?? row.uuid;
  if (typeof itemUuid !== 'string' || !idPattern.test(itemUuid)) { failures.push({productUuid: uuid, stage: 'parse', reason: 'invalid_variant_uuid'}); continue; }
  const dataErrors: Reason[] = [];
  const price = parseMoney(v?.price ?? row.price);
  const cost = parseMoney(v?.cost ?? row.cost);
  const rec = config.recommendedPriceField ? parseMoney(v?.[config.recommendedPriceField] ?? row[config.recommendedPriceField]) : ({kind: 'missing'} as const);
  const stock = units(v?.available_qte ?? row.available_qte, 1);
  if (price.kind === 'invalid') dataErrors.push('invalid_price');
  if (rec.kind === 'invalid') dataErrors.push('invalid_price');
  if (stock === null || stock < 0) dataErrors.push('invalid_stock');
  if (cost.kind === 'invalid') failures.push({productUuid: uuid, stage: 'parse', reason: 'invalid_cost'}); // non-fatal: cost is only used for provisional pricing
  const costMillimes = cost.kind === 'ok' ? cost.millimes : null;
  const accountPrice = price.kind === 'ok' ? price.millimes : null, recommendedPrice = rec.kind === 'ok' ? rec.millimes : null;
  const decision = decide({status: String(row.status ?? ''), missing: false, match, accountPrice, recommendedPrice, cost: costMillimes, stock, dataErrors}, config);
  for (const e of dataErrors) failures.push({productUuid: uuid, stage: 'parse', reason: e});
  items.push({uuid: itemUuid, variantUuid: v ? itemUuid : null, label: asText(v?.name), sku: asText(v?.sku) ?? asText(row.sku), accountPrice, recommendedPrice, cost: costMillimes, stock: stock !== null && stock >= 0 ? stock : null, dataErrors, decision});
 }
 if (!items.length) return {record: null, failures};
 return {
  record: {uuid, sku: asText(row.sku), name, supplierIdentifier: asText(row.supplier_identifier), link, status: String(row.status ?? ''), contentId: match.record?.sourceProductId ?? null, matchMethod: match.method, desiredSlug: match.record?.slug ?? generatedSlug(name, uuid), items},
  failures,
 };
}
export async function runImport(deps: {client: ShipperClient; store: CatalogueStore; config: ImportConfig; trigger: string; now?: () => number}): Promise<RunSummary> {
 const {client, store, config, trigger, now = Date.now} = deps;
 const run = await store.acquireRun({trigger, perPage: config.perPage, leaseMs: config.leaseMs});
 if (!run) return {status: 'busy', runId: null, pagesProcessed: 0, discovered: 0, failedRows: 0, markedMissing: 0};
 const summary: RunSummary = {status: 'paused', runId: Number(run.id), pagesProcessed: 0, discovered: Number(run.discovered), failedRows: Number(run.failed), markedMissing: 0};
 const index = indexContent(await store.loadContent());
 client.setDeadline(now() + config.budgetMs);
 let lastPage = run.last_page;
 for (let page = run.next_page; ; page++) {
  if (page > config.maxPages) { await store.failRun(run.id, `Catalogue exceeds ${config.maxPages} pages`); return {...summary, status: 'failed', error: 'page limit reached'}; }
  let result;
  try { result = await client.listProducts(page, config.perPage); }
  catch (e) {
   if (e instanceof BudgetExceeded) { await store.pauseRun(run.id); return summary; }
   if (e instanceof ShipperError && !e.retryable) { await store.failRun(run.id, e.message); return {...summary, status: 'failed', error: e.message}; }
   const message = e instanceof Error ? e.message : 'Shipper request failed';
   await store.pauseRun(run.id, message);
   return {...summary, error: message};
  }
  const records: ProductRecord[] = [], failures: FailureRecord[] = [], seen = new Set<string>();
  for (const row of result.rows) {
   const mapped = mapRow(row, index, config);
   failures.push(...mapped.failures);
   // Duplicate protection inside a page: the first occurrence of a UUID wins.
   if (mapped.record && !seen.has(mapped.record.uuid)) { seen.add(mapped.record.uuid); records.push(mapped.record); }
   else if (mapped.record) failures.push({productUuid: mapped.record.uuid, stage: 'parse', reason: 'duplicate_in_page'});
  }
  lastPage = result.lastPage ?? lastPage;
  try { await store.applyPage(run.id, page, {lastPage, total: result.total, rowCount: result.rows.length, leaseMs: config.leaseMs}, records, failures); }
  catch (e) {
   const message = e instanceof Error ? e.message : 'Page write failed';
   if (message === 'Import run is no longer active') return {...summary, status: 'busy', error: message};
   await store.pauseRun(run.id, message); // keep the checkpoint; the next call resumes at this page
   throw e;
  }
  summary.pagesProcessed++; summary.discovered += result.rows.length; summary.failedRows += failures.length;
  const done = lastPage !== null ? page >= lastPage : result.rows.length < config.perPage;
  if (!done) continue;
  // Never unpublish the catalogue because of an empty response.
  if (summary.discovered === 0) { await store.failRun(run.id, 'Shipper returned no products; nothing was unpublished'); return {...summary, status: 'failed', error: 'empty catalogue'}; }
  summary.markedMissing = await store.completeRun(run.id);
  return {...summary, status: 'complete'};
 }
}
// Recomputes match and publish state from stored data, e.g. after new content.
export async function reevaluate(deps: {store: CatalogueStore; config: ImportConfig}) {
 const {store, config} = deps;
 const index = indexContent(await store.loadContent());
 let after = '', products = 0;
 for (;;) {
  const batch = await store.productBatch(after, 200);
  if (!batch.length) return {products};
  for (const {product, items} of batch) {
   const match = matchContent({uuid: product.uuid, link: product.link, name: product.name}, index);
   const rows = items.map((row: any) => ({row, decision: decide({
    status: product.status, missing: product.missing, match,
    accountPrice: row.account_price_millimes, recommendedPrice: row.recommended_price_millimes, cost: row.cost_millimes, stock: row.stock,
    dataErrors: row.data_errors || [],
   }, config)}));
   await store.updateEvaluation(product.uuid, match.record?.sourceProductId ?? null, match.method, match.record?.slug ?? generatedSlug(product.name, product.uuid), rows);
   products++;
  }
  after = batch[batch.length - 1].product.uuid;
 }
}

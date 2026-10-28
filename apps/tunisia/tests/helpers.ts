import {PGlite} from '@electric-sql/pglite';
import {wrapPglite} from '../lib/import/db';
import {createStore} from '../lib/import/store';
import {BudgetExceeded, ShipperError, type ProductsPage, type ShipperClient} from '../lib/import/client';
import {loadConfig, type ImportConfig} from '../lib/import/config';
import type {ContentRecord} from '../lib/import/content';
export const baseConfig = (env: Record<string, string> = {}): ImportConfig => loadConfig(env);
export async function memoryStore() {
 const pg = new PGlite();
 const store = createStore(wrapPglite(pg as any));
 await store.ensureSchema();
 return {store, pg};
}
export const row = (i: number, extra: Record<string, unknown> = {}) => ({
 uuid: `acct-${i}`, name: `Product ${i}`, sku: `SKU${i}`, link: `https://app.shipper.market/products/mkt-${i}`, supplier_identifier: 'SUP', status: 'active',
 price: '25.000000000000000000000000000000', cost: '12.500000000000000000000000000000', available_qte: 5, variants: [], ...extra,
});
export const content = (i: number, extra: Partial<ContentRecord> = {}): ContentRecord => ({
 sourceProductId: `mkt-${i}`, sourceName: `Product ${i}`, sourceUrl: null, slug: `product-${i}`, category: i % 2 ? 'kitchen' : 'organisation bedroom',
 title: {en: `Product ${i}`, fr: `Produit ${i}`, ar: `منتج ${i}`}, description: {en: `Text ${i}`, fr: `Texte ${i}`, ar: `نص ${i}`},
 images: [`https://cdn.shipper.network/img/${i}.jpg`], provenance: {en: 'curated', fr: 'curated', ar: 'curated'}, reviewState: 'approved', rights: null, ...extra,
});
// A client that serves scripted pages. A page can be an array of rows or an error to throw once.
export function scriptedClient(pages: Record<number, unknown[]>, opts: {perPage?: number; failOnce?: Record<number, Error>; budgetOnce?: number[]; lastPage?: number | null} = {}) {
 const calls: number[] = [], failed = new Set<number>(), budgeted = new Set<number>();
 const last = opts.lastPage === undefined ? Math.max(...Object.keys(pages).map(Number)) : opts.lastPage;
 const total = Object.values(pages).reduce((n, p) => n + p.length, 0);
 const client: ShipperClient = {
  stats: {requests: 0, retries: 0, rateLimited: 0},
  setDeadline() {},
  async listProducts(page): Promise<ProductsPage> {
   calls.push(page);
   const err = opts.failOnce?.[page];
   if (err && !failed.has(page)) { failed.add(page); throw err; }
   if (opts.budgetOnce?.includes(page) && !budgeted.has(page)) { budgeted.add(page); throw new BudgetExceeded(); }
   return {rows: pages[page] ?? [], lastPage: last, total};
  },
 };
 return {client, calls};
}
export const retryable = () => new ShipperError('Shipper server error (503)', 503, true);
export const pageOf = (from: number, to: number, make: (i: number) => unknown = i => row(i)) => Array.from({length: to - from + 1}, (_, k) => make(from + k));

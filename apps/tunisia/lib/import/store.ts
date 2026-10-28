import type {Db} from './db';
import {schemaSql} from './db';
import {shortId as short, type ContentRecord} from './content';
import type {Decision, Reason} from './decide';
import type {PriceBasis} from './pricing';
export type ItemRecord = {
 uuid: string; variantUuid: string | null; label: string | null; sku: string | null;
 accountPrice: number | null; recommendedPrice: number | null; cost: number | null; stock: number | null;
 dataErrors: Reason[]; decision: Decision;
};
export type ProductRecord = {
 uuid: string; sku: string | null; name: string; supplierIdentifier: string | null; link: string | null; status: string;
 contentId: string | null; matchMethod: string; desiredSlug: string; items: ItemRecord[];
};
export type FailureRecord = {productUuid: string | null; stage: string; reason: string; detail?: string};
export type RunRow = {id: number; status: string; next_page: number; last_page: number | null; total_reported: number | null; discovered: number; failed: number; per_page: number; error: string | null};
const json = (v: unknown) => JSON.stringify(v);
export const likeEscape = (s: string) => s.replace(/[\\%_]/g, c => '\\' + c);
// A run paused for longer than this is abandoned rather than resumed, so a
// half-finished sync never leaves prices stale for long.
const RESUME_WINDOW_MINUTES = 30;
export function createStore(db: Db) {
 async function resolveSlug(tx: Db, uuid: string, desired: string) {
  const clash = await tx.query('SELECT 1 FROM tn_products WHERE slug = $1 AND uuid <> $2 LIMIT 1', [desired, uuid]);
  return clash.rows.length ? `${desired}-${short(uuid)}` : desired;
 }
 // Batched writes: a page of ~100 products is a handful of statements, not hundreds.
 async function resolveSlugs(tx: Db, products: {uuid: string; desiredSlug: string}[]) {
  const owner = new Map<string, string>(); // slug -> uuid that owns it
  const existing = await tx.query<{slug: string; uuid: string}>('SELECT slug, uuid FROM tn_products WHERE slug = ANY($1::text[])', [products.map(p => p.desiredSlug)]);
  for (const r of existing.rows) owner.set(r.slug, r.uuid);
  const out = new Map<string, string>();
  for (const p of products) {
   let slug = p.desiredSlug;
   if (owner.has(slug) && owner.get(slug) !== p.uuid) slug = `${slug}-${short(p.uuid)}`;
   owner.set(slug, p.uuid);
   out.set(p.uuid, slug);
  }
  return out;
 }
 async function writeItems(tx: Db, products: {uuid: string; slug: string; items: ItemRecord[]}[]) {
  const rows: any[] = [], seen = new Set<string>();
  for (const p of products) for (const i of p.items) if (!seen.has(i.uuid)) { seen.add(i.uuid); rows.push({p, i}); }
  await tx.query('DELETE FROM tn_items WHERE product_uuid = ANY($1::text[]) AND NOT (uuid = ANY($2::text[]))', [products.map(p => p.uuid), rows.map(r => r.i.uuid)]);
  if (!rows.length) return;
  const col = (f: (r: any) => unknown) => rows.map(f);
  await tx.query(
   `INSERT INTO tn_items (uuid, product_uuid, variant_uuid, slug, label, sku, account_price_millimes, recommended_price_millimes, cost_millimes, price_millimes, price_basis, stock, data_errors, state, reasons, updated_at)
    SELECT uuid, product_uuid, variant_uuid, slug, label, sku, account_price, recommended_price, cost, price, price_basis, stock, data_errors::jsonb, state, reasons::jsonb, now()
    FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::int[], $8::int[], $9::int[], $10::int[], $11::text[], $12::int[], $13::text[], $14::text[], $15::text[])
     AS t(uuid, product_uuid, variant_uuid, slug, label, sku, account_price, recommended_price, cost, price, price_basis, stock, data_errors, state, reasons)
    ON CONFLICT (uuid) DO UPDATE SET product_uuid=EXCLUDED.product_uuid, variant_uuid=EXCLUDED.variant_uuid, slug=EXCLUDED.slug, label=EXCLUDED.label, sku=EXCLUDED.sku,
     account_price_millimes=EXCLUDED.account_price_millimes, recommended_price_millimes=EXCLUDED.recommended_price_millimes, cost_millimes=EXCLUDED.cost_millimes,
     price_millimes=EXCLUDED.price_millimes, price_basis=EXCLUDED.price_basis, stock=EXCLUDED.stock, data_errors=EXCLUDED.data_errors,
     state=EXCLUDED.state, reasons=EXCLUDED.reasons, updated_at=now()`,
   [col(r => r.i.uuid), col(r => r.p.uuid), col(r => r.i.variantUuid), col(r => (r.i.variantUuid ? `${r.p.slug}-${r.i.variantUuid}` : r.p.slug)), col(r => r.i.label), col(r => r.i.sku),
    col(r => r.i.accountPrice), col(r => r.i.recommendedPrice), col(r => r.i.cost), col(r => r.i.decision.price), col(r => r.i.decision.basis), col(r => r.i.stock),
    col(r => json(r.i.dataErrors)), col(r => r.i.decision.state), col(r => json(r.i.decision.reasons))]);
 }
 return {
  db,
  ensureSchema: async () => { await db.exec(schemaSql); },

  async acquireRun(opts: {trigger: string; perPage: number; leaseMs: number}): Promise<RunRow | null> {
   await db.query(`UPDATE tn_import_runs SET status='paused' WHERE status='running' AND lease_until < now()`);
   await db.query(`UPDATE tn_import_runs SET status='abandoned', finished_at=now() WHERE status='paused' AND started_at < now() - ($1::int * interval '1 minute')`, [RESUME_WINDOW_MINUTES]);
   try {
    const paused = await db.query<RunRow>(`SELECT id FROM tn_import_runs WHERE status='paused' ORDER BY id DESC LIMIT 1`);
    const lease = `now() + ($2::int * interval '1 millisecond')`;
    const res = paused.rows.length
     ? await db.query<RunRow>(`UPDATE tn_import_runs SET status='running', trigger=$3, error=NULL, lease_until=${lease} WHERE id=$1 AND status='paused' RETURNING *`, [paused.rows[0].id, opts.leaseMs, opts.trigger])
     : await db.query<RunRow>(`INSERT INTO tn_import_runs (status, trigger, per_page, lease_until) VALUES ('running', $1, $3, ${lease}) RETURNING *`, [opts.trigger, opts.leaseMs, opts.perPage]);
    return res.rows[0] || null;
   } catch (e: any) {
    if (e?.code === '23505') return null; // another run holds the lease
    throw e;
   }
  },
  async pauseRun(id: number, error?: string) {
   await db.query(`UPDATE tn_import_runs SET status='paused', error=$2, lease_until=NULL WHERE id=$1 AND status='running'`, [id, error?.slice(0, 300) ?? null]);
  },
  async failRun(id: number, error: string) {
   await db.query(`UPDATE tn_import_runs SET status='failed', error=$2, finished_at=now(), lease_until=NULL WHERE id=$1`, [id, error.slice(0, 300)]);
  },

  // One page = one transaction: upserts and the checkpoint commit together, so a
  // crash can never record progress for rows that were not written.
  async applyPage(runId: number, page: number, meta: {lastPage: number | null; total: number | null; rowCount: number; leaseMs: number}, products: ProductRecord[], failures: FailureRecord[]) {
   await db.tx(async tx => {
    const run = await tx.query<{status: string}>('SELECT status FROM tn_import_runs WHERE id=$1 FOR UPDATE', [runId]);
    if (run.rows[0]?.status !== 'running') throw new Error('Import run is no longer active');
    if (products.length) {
     const slugs = await resolveSlugs(tx, products);
     const col = (f: (p: ProductRecord) => unknown) => products.map(f);
     await tx.query(
      `INSERT INTO tn_products (uuid, sku, name, supplier_identifier, link, status, content_id, match_method, slug, last_seen_run, missing, updated_at)
       SELECT uuid, sku, name, supplier_identifier, link, status, content_id, match_method, slug, $10::bigint, false, now()
       FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::text[], $9::text[])
        AS t(uuid, sku, name, supplier_identifier, link, status, content_id, match_method, slug)
       ON CONFLICT (uuid) DO UPDATE SET sku=EXCLUDED.sku, name=EXCLUDED.name, supplier_identifier=EXCLUDED.supplier_identifier, link=EXCLUDED.link, status=EXCLUDED.status,
        content_id=EXCLUDED.content_id, match_method=EXCLUDED.match_method, slug=EXCLUDED.slug, last_seen_run=EXCLUDED.last_seen_run, missing=false, updated_at=now()`,
      [col(p => p.uuid), col(p => p.sku), col(p => p.name), col(p => p.supplierIdentifier), col(p => p.link), col(p => p.status), col(p => p.contentId), col(p => p.matchMethod), col(p => slugs.get(p.uuid)), runId]);
     await writeItems(tx, products.map(p => ({uuid: p.uuid, slug: slugs.get(p.uuid)!, items: p.items})));
    }
    if (failures.length) {
     await tx.query(
      `INSERT INTO tn_import_failures (run_id, product_uuid, stage, reason, detail)
       SELECT $1::bigint, product_uuid, stage, reason, detail FROM unnest($2::text[], $3::text[], $4::text[], $5::text[]) AS t(product_uuid, stage, reason, detail)`,
      [runId, failures.map(f => f.productUuid), failures.map(f => f.stage), failures.map(f => f.reason), failures.map(f => f.detail?.slice(0, 200) ?? null)]);
    }
    await tx.query(
     `UPDATE tn_import_runs SET next_page=$2, last_page=COALESCE($3, last_page), total_reported=COALESCE($4, total_reported), discovered=discovered+$5, failed=failed+$6,
       lease_until = now() + ($7::int * interval '1 millisecond') WHERE id=$1`,
     [runId, page + 1, meta.lastPage, meta.total, meta.rowCount, failures.length, meta.leaseMs]);
   });
  },

  // Only a run that read every page may declare unseen products missing.
  async completeRun(runId: number): Promise<number> {
   return db.tx(async tx => {
    const gone = await tx.query<{uuid: string}>(`UPDATE tn_products SET missing=true, updated_at=now() WHERE missing=false AND last_seen_run IS DISTINCT FROM $1 RETURNING uuid`, [runId]);
    if (gone.rows.length) await tx.query(`UPDATE tn_items SET state='pending', reasons='["missing_from_account"]'::jsonb, updated_at=now() WHERE product_uuid = ANY($1::text[])`, [gone.rows.map(r => r.uuid)]);
    await tx.query(`UPDATE tn_import_runs SET status='complete', finished_at=now(), lease_until=NULL, error=NULL WHERE id=$1`, [runId]);
    return gone.rows.length;
   });
  },

  async loadContent(): Promise<ContentRecord[]> {
   const res = await db.query('SELECT * FROM tn_content');
   return res.rows.map(r => ({sourceProductId: r.source_product_id, sourceName: r.source_name, sourceUrl: r.source_url, slug: r.slug, category: r.category, title: r.title, description: r.description, images: r.images, provenance: r.provenance, reviewState: r.review_state, rights: r.rights}));
  },
  async upsertContent(rows: ContentRecord[]) {
   let written = 0;
   for (const r of rows) {
    // A slug already used by different content gets a suffix, never an overwrite.
    const clash = await db.query('SELECT 1 FROM tn_content WHERE slug=$1 AND source_product_id<>$2 LIMIT 1', [r.slug, r.sourceProductId]);
    const slug = clash.rows.length ? `${r.slug}-${short(r.sourceProductId)}` : r.slug;
    await db.query(
     `INSERT INTO tn_content (source_product_id, source_name, source_url, slug, category, title, description, images, provenance, review_state, rights, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10,$11,now())
      ON CONFLICT (source_product_id) DO UPDATE SET source_name=EXCLUDED.source_name, source_url=EXCLUDED.source_url, slug=EXCLUDED.slug, category=EXCLUDED.category, title=EXCLUDED.title,
       description=EXCLUDED.description, images=EXCLUDED.images, provenance=EXCLUDED.provenance, review_state=EXCLUDED.review_state, rights=EXCLUDED.rights, updated_at=now()`,
     [r.sourceProductId, r.sourceName, r.sourceUrl, slug, r.category, json(r.title), json(r.description), json(r.images), json(r.provenance), r.reviewState, r.rights]);
    written++;
   }
   return written;
  },

  // Batched read for re-evaluation after content changes. Includes cost: this is
  // an internal method and its rows never reach the browser.
  async productBatch(afterUuid: string, limit: number) {
   const prods = await db.query('SELECT * FROM tn_products WHERE uuid > $1 ORDER BY uuid LIMIT $2', [afterUuid, limit]);
   if (!prods.rows.length) return [];
   const items = await db.query('SELECT * FROM tn_items WHERE product_uuid = ANY($1::text[]) ORDER BY uuid', [prods.rows.map(p => p.uuid)]);
   return prods.rows.map(p => ({product: p, items: items.rows.filter(i => i.product_uuid === p.uuid)}));
  },
  async updateEvaluation(productUuid: string, contentId: string | null, matchMethod: string, desiredSlug: string, items: {row: any; decision: Decision}[]) {
   await db.tx(async tx => {
    const slug = await resolveSlug(tx, productUuid, desiredSlug);
    await tx.query('UPDATE tn_products SET content_id=$2, match_method=$3, slug=$4, updated_at=now() WHERE uuid=$1', [productUuid, contentId, matchMethod, slug]);
    for (const {row, decision} of items) {
     await tx.query(`UPDATE tn_items SET slug=$2, price_millimes=$3, price_basis=$4, state=$5, reasons=$6::jsonb, updated_at=now() WHERE uuid=$1`,
      [row.uuid, row.variant_uuid ? `${slug}-${row.variant_uuid}` : slug, decision.price, decision.basis, decision.state, json(decision.reasons)]);
    }
   });
  },

  async lastSync() {
   const done = await db.query<{at: string | null}>(`SELECT max(finished_at) AS at FROM tn_import_runs WHERE status='complete'`);
   return done.rows[0]?.at ? new Date(done.rows[0].at) : null;
  },
  async latestRun() {
   return (await db.query<RunRow & {started_at: string; finished_at: string | null}>('SELECT * FROM tn_import_runs ORDER BY id DESC LIMIT 1')).rows[0] || null;
  },

  async report() {
   const counts = async (sql: string) => Object.fromEntries((await db.query<{k: string; n: string}>(sql)).rows.map(r => [r.k, Number(r.n)]));
   const run = await db.query('SELECT * FROM tn_import_runs ORDER BY id DESC LIMIT 1');
   const last = run.rows[0] || null;
   const lastComplete = (await db.query('SELECT * FROM tn_import_runs WHERE status=\'complete\' ORDER BY id DESC LIMIT 1')).rows[0] || null;
   const ref = last ?? lastComplete;
   const num = async (sql: string) => Number((await db.query<{n: string}>(sql)).rows[0].n);
   const awaiting = await db.query(`SELECT c.source_product_id AS id, c.source_name AS name FROM tn_content c WHERE NOT EXISTS (SELECT 1 FROM tn_products p WHERE p.content_id = c.source_product_id) ORDER BY c.source_name LIMIT 500`);
   const failures = ref ? await db.query(`SELECT product_uuid, stage, reason FROM tn_import_failures WHERE run_id=$1 ORDER BY id LIMIT 100`, [ref.id]) : {rows: []};
   return {
    generatedAt: new Date().toISOString(),
    // The public API lists only our account catalogue; marketplace-wide discovery is not available.
    scope: 'account_catalogue' as const,
    marketplaceDiscoverable: false,
    run: last && {id: Number(last.id), status: last.status, discovered: last.discovered, failedRows: last.failed, totalReported: last.total_reported, nextPage: last.next_page, lastPage: last.last_page, error: last.error, startedAt: last.started_at, finishedAt: last.finished_at},
    lastCompleteRunId: lastComplete ? Number(lastComplete.id) : null,
    products: {imported: await num('SELECT count(*) AS n FROM tn_products'), missingFromAccount: await num('SELECT count(*) AS n FROM tn_products WHERE missing')},
    items: {
     imported: await num('SELECT count(*) AS n FROM tn_items'),
     published: await num(`SELECT count(*) AS n FROM tn_items WHERE state='published'`),
     pending: await num(`SELECT count(*) AS n FROM tn_items WHERE state='pending'`),
     failed: await num(`SELECT count(*) AS n FROM tn_items WHERE state='failed'`),
    },
    pendingByReason: await counts(`SELECT r AS k, count(*) AS n FROM tn_items, jsonb_array_elements_text(reasons) r WHERE state='pending' GROUP BY r ORDER BY r`),
    failedByReason: await counts(`SELECT r AS k, count(*) AS n FROM tn_items, jsonb_array_elements_text(reasons) r WHERE state='failed' GROUP BY r ORDER BY r`),
    publishedByPriceBasis: await counts(`SELECT COALESCE(price_basis,'none') AS k, count(*) AS n FROM tn_items WHERE state='published' GROUP BY 1 ORDER BY 1`),
    publishedOutOfStock: await num(`SELECT count(*) AS n FROM tn_items WHERE state='published' AND stock = 0`),
    contentMatchMethods: await counts(`SELECT match_method AS k, count(*) AS n FROM tn_products GROUP BY 1 ORDER BY 1`),
    content: {records: await num('SELECT count(*) AS n FROM tn_content'), awaitingEnrolment: awaiting.rows.map(r => ({sourceProductId: r.id, name: r.name}))},
    failures: failures.rows.map(r => ({productUuid: r.product_uuid, stage: r.stage, reason: r.reason})),
   };
  },

  // ---- Storefront reads. Explicit column lists: cost and internal state never leave here. ----
  async search(opts: {patterns: string[]; locale: string; limit: number; offset: number}) {
   const where = opts.patterns.length ? `AND (c.category || ' ' || COALESCE(c.title->>$1, '')) ILIKE ANY($2::text[])` : '';
   const args: unknown[] = opts.patterns.length ? [opts.locale, opts.patterns] : [];
   const total = await db.query<{n: string}>(`SELECT count(*) AS n FROM tn_items i JOIN tn_products p ON p.uuid=i.product_uuid JOIN tn_content c ON c.source_product_id=p.content_id WHERE i.state='published' ${where}`, args);
   const rows = await db.query(`${PUBLIC_SELECT} WHERE i.state='published' ${where} ORDER BY p.first_seen_at DESC, i.uuid LIMIT $${args.length + 1} OFFSET $${args.length + 2}`, [...args, opts.limit, opts.offset]);
   return {total: Number(total.rows[0].n), rows: rows.rows};
  },
  async bySlug(slug: string) {
   return (await db.query(`${PUBLIC_SELECT} WHERE i.state='published' AND i.slug=$1`, [slug])).rows[0] || null;
  },
  async byIds(ids: string[]) {
   return (await db.query(`${PUBLIC_SELECT} WHERE i.state='published' AND i.uuid = ANY($1::text[])`, [ids])).rows;
  },
 };
}
const PUBLIC_SELECT = `SELECT i.uuid AS id, i.slug, i.label, i.price_millimes, i.stock, c.category, c.title, c.description, c.images
 FROM tn_items i JOIN tn_products p ON p.uuid=i.product_uuid JOIN tn_content c ON c.source_product_id=p.content_id`;
export type CatalogueStore = ReturnType<typeof createStore>;
export type {PriceBasis};

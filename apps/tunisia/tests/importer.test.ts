import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reevaluate, runImport} from '../lib/import/runner';
import {rowToProduct, searchStore} from '../lib/import/read';
import {baseConfig, content, memoryStore, pageOf, retryable, row, scriptedClient} from './helpers';
import {ideas} from '../lib/merchandising';
const config = baseConfig();
const hosts = config.imageHosts;
async function setup(contentIds: number[] = []) {
 const {store, pg} = await memoryStore();
 await store.upsertContent(contentIds.map(i => content(i)));
 return {store, pg};
}
const count = async (store: Awaited<ReturnType<typeof memoryStore>>['store'], sql: string) => Number((await store.db.query<{n: string}>(sql)).rows[0].n);
const run = (store: any, client: any, cfg = config) => runImport({client, store, config: cfg, trigger: 'test'});

test('imports every page, publishes products that have content and a price, and reports the rest with reasons', async () => {
 const {store} = await setup(Array.from({length: 150}, (_, i) => i + 1)); // content for 1..150 of 250
 const {client} = scriptedClient({1: pageOf(1, 100), 2: pageOf(101, 200), 3: pageOf(201, 250)});
 const summary = await run(store, client);
 assert.deepEqual([summary.status, summary.pagesProcessed, summary.discovered], ['complete', 3, 250]);
 const report = await store.report();
 assert.deepEqual(report.items, {imported: 250, published: 150, pending: 100, failed: 0});
 assert.deepEqual(report.pendingByReason, {no_content: 100});
 assert.equal(report.scope, 'account_catalogue'); assert.equal(report.marketplaceDiscoverable, false);
 assert.equal(report.run?.discovered, 250); assert.equal(report.products.imported, 250);
});
test('a failed page pauses the run at a checkpoint and the next call resumes there, without duplicates', async () => {
 const {store} = await setup([1, 2, 3, 4, 5, 6]);
 const pages = {1: pageOf(1, 2), 2: pageOf(3, 4), 3: pageOf(5, 6)};
 const first = scriptedClient(pages, {failOnce: {2: retryable()}});
 const a = await run(store, first.client);
 assert.equal(a.status, 'paused'); assert.deepEqual(first.calls, [1, 2]);
 assert.equal(await count(store, 'SELECT count(*) AS n FROM tn_products'), 2);
 const second = scriptedClient(pages);
 const b = await run(store, second.client);
 assert.equal(b.status, 'complete'); assert.deepEqual(second.calls, [2, 3]); // page 1 is not fetched again
 assert.equal(await count(store, 'SELECT count(*) AS n FROM tn_products'), 6);
 assert.equal(await count(store, `SELECT count(*) AS n FROM tn_import_runs WHERE status='complete'`), 1);
});
test('hitting the time budget pauses and resumes as well', async () => {
 const {store} = await setup([1, 2, 3, 4]);
 const pages = {1: pageOf(1, 2), 2: pageOf(3, 4)};
 const t = scriptedClient(pages, {budgetOnce: [2]});
 assert.equal((await run(store, t.client)).status, 'paused');
 assert.equal((await run(store, t.client)).status, 'complete');
 assert.equal((await store.report()).items.published, 4);
});
test('re-running is idempotent and refreshes selling price and stock', async () => {
 const {store} = await setup([1, 2]);
 await run(store, scriptedClient({1: [row(1), row(2)]}).client);
 const before = await store.report();
 await run(store, scriptedClient({1: [row(1, {price: '31.500', available_qte: 9}), row(2, {available_qte: 0})]}).client);
 const after = await store.report();
 assert.deepEqual(after.items, before.items);
 const p1 = rowToProduct(await store.bySlug('product-1'), hosts)!;
 assert.deepEqual([p1.priceMillimes, p1.stock], [31500, 9]);
 assert.equal(rowToProduct(await store.bySlug('product-2'), hosts)!.stock, 0);
 assert.equal(after.publishedOutOfStock, 1);
});
test('duplicates are ignored: the same UUID twice in a page, or again on a later page, yields one product', async () => {
 const {store} = await setup([1, 2]);
 const t = scriptedClient({1: [row(1), row(1, {price: '99'}), row(2)], 2: [row(1)]});
 const s = await run(store, t.client);
 assert.equal(await count(store, 'SELECT count(*) AS n FROM tn_products'), 2);
 assert.equal(rowToProduct(await store.bySlug('product-1'), hosts)!.priceMillimes, 25000); // first occurrence on the page wins, later page refreshes it
 assert.ok((await store.report()).failures.some(f => f.reason === 'duplicate_in_page'));
 assert.equal(s.status, 'complete');
});
test('bad supplier data fails visibly: unparseable money or stock, rows without an id, and missing prices', async () => {
 const {store} = await setup([1, 2, 3, 4]);
 const rows = [row(1, {price: 'abc'}), row(2, {available_qte: 'lots'}), row(3, {price: null}), {name: 'No id'}, row(4)];
 await run(store, scriptedClient({1: rows}).client);
 const r = await store.report();
 assert.deepEqual(r.items, {imported: 4, published: 1, pending: 1, failed: 2});
 assert.deepEqual(r.failedByReason, {invalid_price: 1, invalid_stock: 1});
 assert.deepEqual(r.pendingByReason, {no_price: 1});
 assert.ok(r.failures.some(f => f.reason === 'invalid_row'));
 assert.equal(r.run?.discovered, 5);
});
test('cost is never used as the price: no price stays pending, and a price equal to cost is held', async () => {
 const {store} = await setup([1, 2]);
 await run(store, scriptedClient({1: [row(1, {price: null, cost: '12.5'}), row(2, {price: '12.5', cost: '12.5'})]}).client);
 const r = await store.report();
 assert.deepEqual(r.pendingByReason, {no_price: 1, price_below_cost: 1});
 assert.equal(r.items.published, 0);
 assert.equal(await count(store, 'SELECT count(*) AS n FROM tn_items WHERE price_millimes = cost_millimes AND state=\'published\''), 0);
});
test('provisional pricing publishes with a distinct price basis and never at or below cost', async () => {
 const {store} = await setup([1, 2]);
 const cfg = baseConfig({TUNISIA_PROVISIONAL_PRICING: 'markup', TUNISIA_PROVISIONAL_MARKUP_PCT: '40'});
 await run(store, scriptedClient({1: [row(1, {price: null}), row(2)]}).client, cfg);
 const r = await store.report();
 assert.deepEqual(r.publishedByPriceBasis, {account: 1, provisional: 1});
 assert.equal(await count(store, `SELECT count(*) AS n FROM tn_items WHERE price_basis='provisional' AND price_millimes > cost_millimes AND price_millimes > 0`), 1);
 assert.equal(await count(store, `SELECT count(*) AS n FROM tn_items WHERE price_millimes IS NOT NULL AND price_millimes <= 0`), 0);
});
test('variants map to their own UUIDs, and a removed variant disappears', async () => {
 const {store} = await setup([1]);
 const withVariants = row(1, {variants: [{uuid: 'var-a', name: 'Red', price: '30', cost: '15', available_qte: 2}, {uuid: 'var-b', name: 'Blue', price: '35', cost: '15', available_qte: 4}]});
 await run(store, scriptedClient({1: [withVariants]}).client);
 const items = (await store.db.query<{uuid: string; variant_uuid: string; slug: string}>('SELECT uuid, variant_uuid, slug FROM tn_items ORDER BY uuid')).rows;
 assert.deepEqual(items.map(i => i.uuid), ['var-a', 'var-b']);
 assert.deepEqual(items.map(i => i.slug), ['product-1-var-a', 'product-1-var-b']);
 const red = rowToProduct(await store.bySlug('product-1-var-a'), hosts)!;
 assert.deepEqual([red.supplierProductId, red.priceMillimes, red.stock, red.title.fr], ['var-a', 30000, 2, 'Produit 1 — Red']);
 await run(store, scriptedClient({1: [row(1, {variants: [{uuid: 'var-b', name: 'Blue', price: '35', cost: '15', available_qte: 4}]})]}).client);
 assert.deepEqual((await store.db.query('SELECT uuid FROM tn_items')).rows.map((r: any) => r.uuid), ['var-b']);
});
test('products that disappear from a complete run are unpublished; an empty response never unpublishes anything', async () => {
 const {store} = await setup([1, 2, 3]);
 await run(store, scriptedClient({1: [row(1), row(2), row(3)]}).client);
 const s = await run(store, scriptedClient({1: [row(1), row(2)]}).client);
 assert.equal(s.markedMissing, 1);
 const r = await store.report();
 assert.deepEqual([r.items.published, r.pendingByReason.missing_from_account, r.products.missingFromAccount], [2, 1, 1]);
 assert.equal(await store.bySlug('product-3'), null);
 const empty = await run(store, scriptedClient({1: []}).client);
 assert.equal(empty.status, 'failed');
 assert.equal((await store.report()).items.published, 2);
});
test('a second run cannot start while one holds the lease, and a stale paused run is abandoned', async () => {
 const {store} = await setup([1]);
 const lease = await store.acquireRun({trigger: 't', perPage: 100, leaseMs: 60000});
 assert.ok(lease);
 assert.equal((await run(store, scriptedClient({1: [row(1)]}).client)).status, 'busy');
 await store.pauseRun(lease!.id);
 await store.db.query(`UPDATE tn_import_runs SET started_at = now() - interval '2 hours' WHERE id=$1`, [lease!.id]);
 const next = await store.acquireRun({trigger: 't', perPage: 100, leaseMs: 60000});
 assert.notEqual(next!.id, lease!.id); assert.equal(next!.next_page, 1);
 assert.equal((await store.db.query<{status: string}>('SELECT status FROM tn_import_runs WHERE id=$1', [lease!.id])).rows[0].status, 'abandoned');
});
test('adding content later publishes previously pending products without calling Shipper again', async () => {
 const {store} = await setup([]);
 await run(store, scriptedClient({1: [row(1), row(2)]}).client);
 assert.equal((await store.report()).pendingByReason.no_content, 2);
 await store.upsertContent([content(1), content(2, {sourceProductId: 'mkt-other', sourceName: 'Other name'})]); // 1 matches by link, 2 does not match
 await reevaluate({store, config});
 const r = await store.report();
 assert.deepEqual([r.items.published, r.pendingByReason.no_content], [1, 1]);
 assert.deepEqual(r.contentMatchMethods, {link: 1, none: 1});
 assert.deepEqual(r.content.awaitingEnrolment, [{sourceProductId: 'mkt-other', name: 'Other name'}]);
});
test('slug collisions get a suffix instead of failing the import', async () => {
 const {store} = await setup([]);
 await store.upsertContent([content(1, {sourceProductId: 'mkt-a', sourceName: 'Same'}), content(1, {sourceProductId: 'mkt-b', sourceName: 'Same', slug: 'product-1'})]);
 assert.equal((await store.loadContent()).length, 2);
 const slugs = (await store.db.query<{slug: string}>('SELECT slug FROM tn_content ORDER BY slug')).rows.map(r => r.slug);
 assert.equal(new Set(slugs).size, 2);
});
test('public queries never expose supplier cost or internal state', async () => {
 const {store} = await setup([1, 2]);
 await run(store, scriptedClient({1: [row(1, {cost: '7.777'}), row(2)]}).client);
 const page = await searchStore(store, {q: '', locale: 'en', page: 1, size: 24, ideas, hosts});
 const detail = rowToProduct(await store.bySlug('product-1'), hosts)!;
 const serialised = JSON.stringify([page, detail, await store.byIds(['acct-1'])]);
 assert.ok(!/cost|7\.777|7777|reasons|state/i.test(serialised), serialised.slice(0, 300));
});
test('search is paginated on the server and clamps out-of-range pages', async () => {
 const {store} = await setup(Array.from({length: 130}, (_, i) => i + 1));
 await run(store, scriptedClient({1: pageOf(1, 100), 2: pageOf(101, 130)}).client);
 const p1 = await searchStore(store, {q: '', locale: 'en', page: 1, size: 24, ideas, hosts});
 assert.deepEqual([p1.items.length, p1.total, p1.pages, p1.page], [24, 130, 6, 1]);
 const last = await searchStore(store, {q: '', locale: 'en', page: 99, size: 24, ideas, hosts});
 assert.deepEqual([last.page, last.items.length], [6, 10]);
 const kitchen = await searchStore(store, {q: 'kitchen', locale: 'en', page: 1, size: 24, ideas, hosts});
 assert.equal(kitchen.total, 65);
 const wildcard = await searchStore(store, {q: '%', locale: 'en', page: 1, size: 24, ideas, hosts});
 assert.equal(wildcard.total, 0); // LIKE wildcards in user input are escaped
 const french = await searchStore(store, {q: 'Produit 12', locale: 'fr', page: 1, size: 24, ideas, hosts});
 assert.ok(french.total >= 1);
});

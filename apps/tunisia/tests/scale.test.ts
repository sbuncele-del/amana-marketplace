import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type {AddressInfo} from 'node:net';
import {createShipperClient} from '../lib/import/client';
import {runImport} from '../lib/import/runner';
import {searchStore} from '../lib/import/read';
import {ideas} from '../lib/merchandising';
import {baseConfig, content, memoryStore, row} from './helpers';
const TOTAL = 2500, WITH_CONTENT = 2000;
// A local stand-in for GET /products with 100-per-page pagination, a rate limit and transient failures.
function mockShipper() {
 const hits: Record<number, number> = {}, auth: (string | undefined)[] = [];
 const server = http.createServer((req, res) => {
  const url = new URL(req.url!, 'http://x');
  auth.push(req.headers.authorization);
  const page = Number(url.searchParams.get('page')), perPage = Number(url.searchParams.get('per_page'));
  hits[page] = (hits[page] || 0) + 1;
  if (page === 3 && hits[page] === 1) { res.writeHead(429, {'retry-after': '0'}); return res.end('{}'); }
  if (page === 7 && hits[page] === 1) { res.writeHead(500); return res.end('{}'); }
  const rows = Array.from({length: TOTAL}, (_, k) => k + 1).slice((page - 1) * perPage, page * perPage).map(i =>
   i % 500 === 0 ? row(i, {price: null}) : i % 7 === 0 ? row(i, {variants: [{uuid: `v${i}a`, name: 'A', price: '30', cost: '10', available_qte: 3}, {uuid: `v${i}b`, name: 'B', price: '32', cost: '10', available_qte: 0}]}) : row(i));
  res.writeHead(200, {'content-type': 'application/json', 'x-ratelimit-remaining': '100'});
  res.end(JSON.stringify({data: rows, pagination: {page, per_page: perPage, total: TOTAL, last_page: Math.ceil(TOTAL / perPage)}}));
 });
 return {server, hits, auth};
}
test('imports a 2,500-product account catalogue over HTTP: retries, resumes after an interruption, and reconciles the counts', async () => {
 const mock = mockShipper();
 await new Promise<void>(r => mock.server.listen(0, '127.0.0.1', r));
 const baseUrl = `http://127.0.0.1:${(mock.server.address() as AddressInfo).port}`;
 const {store} = await memoryStore();
 await store.upsertContent(Array.from({length: WITH_CONTENT}, (_, i) => content(i + 1)));
 const config = baseConfig();
 const client = () => createShipperClient({token: 'test-token', baseUrl, minIntervalMs: 0, sleep: async () => {}, random: () => 0});
 // First invocation is cut short after 10 pages (simulating a function timeout)...
 const first = client();
 let seen = 0;
 const limited = {...first, async listProducts(page: number, per: number) { if (++seen > 10) { const {BudgetExceeded} = await import('../lib/import/client'); throw new BudgetExceeded(); } return first.listProducts(page, per); }};
 const a = await runImport({client: limited, store, config, trigger: 'test'});
 assert.equal(a.status, 'paused');
 assert.equal((await store.report()).run?.nextPage, 11);
 // ...and the second resumes at page 11 and finishes.
 const second = client();
 const b = await runImport({client: second, store, config, trigger: 'test'});
 assert.equal(b.status, 'complete');
 assert.equal(mock.hits[1], 1, 'page 1 was fetched once: the resumed run did not start over');
 assert.equal(mock.hits[3], 2, 'the 429 on page 3 was retried');
 assert.equal(mock.hits[7], 2, 'the 500 on page 7 was retried');
 assert.ok(mock.auth.every(h => h === 'Bearer test-token'));
 const r = await store.report();
 assert.equal(r.run?.discovered, TOTAL);
 assert.equal(r.products.imported, TOTAL);
 // 2,500 products; every 7th has 2 variants (357 products -> +357 items); 5 have no price.
 const variantProducts = Array.from({length: TOTAL}, (_, k) => k + 1).filter(i => i % 7 === 0 && i % 500 !== 0).length;
 assert.equal(r.items.imported, TOTAL + variantProducts);
 assert.equal(r.items.failed, 0);
 assert.equal(r.items.published + r.items.pending, r.items.imported);
 assert.equal(r.pendingByReason.no_price, 5);
 assert.ok(r.pendingByReason.no_content > 0);
 assert.equal(r.items.published, await store.db.query<{n: string}>(`SELECT count(*) AS n FROM tn_items WHERE state='published'`).then(x => Number(x.rows[0].n)));
 // Storefront reads are paged: no request ever returns the catalogue.
 const page = await searchStore(store, {q: '', locale: 'fr', page: 2, size: 24, ideas, hosts: config.imageHosts});
 assert.equal(page.items.length, 24); assert.equal(page.total, r.items.published);
 console.log('verified counts:', JSON.stringify({discovered: r.run?.discovered, productsImported: r.products.imported, itemsImported: r.items.imported, published: r.items.published, pending: r.items.pending, failed: r.items.failed, pendingByReason: r.pendingByReason, requests: second.stats.requests + first.stats.requests, retries: second.stats.retries + first.stats.retries}));
 await new Promise(r => mock.server.close(r));
});

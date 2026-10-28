import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BudgetExceeded, createShipperClient, ShipperError} from '../lib/import/client';
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), {status, headers});
const page = (n: number, last = 3) => json({data: [{uuid: `u${n}`}], pagination: {last_page: last, total: 3}}, 200, {'x-ratelimit-remaining': '100'});
function make(responses: (Response | Error)[], extra: Record<string, unknown> = {}) {
 const waits: number[] = [], urls: string[] = [];
 let i = 0;
 const fetchImpl = (async (url: string) => { urls.push(url); const r = responses[Math.min(i++, responses.length - 1)]; if (r instanceof Error) throw r; return r.clone(); }) as unknown as typeof fetch;
 const client = createShipperClient({token: 't', fetchImpl, sleep: async ms => { waits.push(ms); }, minIntervalMs: 0, random: () => 1, ...extra});
 return {client, waits, urls, calls: () => i};
}
test('reads a page with pagination metadata and sends the bearer token only in the header', async () => {
 const t = make([page(1)]);
 const res = await t.client.listProducts(1, 100);
 assert.deepEqual([res.rows.length, res.lastPage, res.total], [1, 3, 3]);
 assert.equal(t.urls[0], 'https://server.shipper.network/api/v1/products?per_page=100&page=1');
 assert.ok(!t.urls[0].includes('t&') && !t.urls[0].includes('token'));
});
test('retries server errors with backoff and then succeeds', async () => {
 const t = make([json({}, 503), json({}, 502), page(1)]);
 assert.equal((await t.client.listProducts(1, 100)).rows.length, 1);
 assert.equal(t.calls(), 3); assert.equal(t.client.stats.retries, 2); assert.equal(t.waits.length, 2);
});
test('honours Retry-After on 429 and records the rate limiting', async () => {
 const t = make([json({}, 429, {'retry-after': '7'}), page(1)]);
 await t.client.listProducts(1, 100);
 assert.deepEqual(t.waits, [7000]); assert.equal(t.client.stats.rateLimited, 1);
});
test('does not retry authentication or client errors', async () => {
 for (const status of [401, 403, 404, 422]) {
  const t = make([json({}, status)]);
  await assert.rejects(t.client.listProducts(1, 100), (e: unknown) => e instanceof ShipperError && e.status === status && !e.retryable);
  assert.equal(t.calls(), 1);
 }
});
test('gives up after the retry limit with a retryable error', async () => {
 const t = make([json({}, 500)], {maxRetries: 2});
 await assert.rejects(t.client.listProducts(1, 100), (e: unknown) => e instanceof ShipperError && e.retryable);
 assert.equal(t.calls(), 3);
});
test('network failures are retried', async () => {
 const t = make([new TypeError('fetch failed'), page(1)]);
 assert.equal((await t.client.listProducts(1, 100)).rows.length, 1);
});
test('an unexpected response shape is rejected rather than treated as an empty catalogue', async () => {
 const t = make([json({nope: true})], {maxRetries: 0});
 await assert.rejects(t.client.listProducts(1, 100), /Unexpected catalogue response/);
});
test('waits for a cooldown when the rate-limit budget is nearly spent', async () => {
 const t = make([json({data: [], pagination: {last_page: 1, total: 0}}, 200, {'x-ratelimit-remaining': '1'})], {cooldownMs: 4321});
 await t.client.listProducts(1, 100);
 assert.deepEqual(t.waits, [4321]);
});
test('a wait that would pass the time budget pauses the run instead of sleeping', async () => {
 let clock = 0;
 const t = make([json({}, 429, {'retry-after': '60'}), page(1)], {now: () => clock});
 t.client.setDeadline(clock + 30000);
 await assert.rejects(t.client.listProducts(1, 100), BudgetExceeded);
 assert.deepEqual(t.waits, []);
});
test('a missing last_page is reported as unknown, not guessed', async () => {
 const t = make([json({data: [{uuid: 'a'}], pagination: {}})]);
 const res = await t.client.listProducts(1, 100);
 assert.deepEqual([res.lastPage, res.total], [null, null]);
});

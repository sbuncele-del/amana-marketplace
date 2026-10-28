// Read-only Shipper client: retries, rate-limit handling and a time budget.
// It only ever issues GET /products; it cannot create orders or change anything.
export class ShipperError extends Error {
 constructor(message: string, readonly status?: number, readonly retryable = false) { super(message); }
}
export class BudgetExceeded extends Error { constructor() { super('Time budget exhausted'); } }
export type ProductsPage = {rows: unknown[]; lastPage: number | null; total: number | null};
export type ShipperClient = {listProducts(page: number, perPage: number): Promise<ProductsPage>; setDeadline(at: number | null): void; stats: {requests: number; retries: number; rateLimited: number}};
export type ClientOptions = {
 token: string; baseUrl?: string; fetchImpl?: typeof fetch; sleep?: (ms: number) => Promise<void>; now?: () => number; random?: () => number;
 maxRetries?: number; minIntervalMs?: number; cooldownMs?: number; timeoutMs?: number;
};
export function createShipperClient(opts: ClientOptions): ShipperClient {
 const {token, baseUrl = 'https://server.shipper.network/api/v1', fetchImpl = fetch, sleep = ms => new Promise(r => setTimeout(r, ms)), now = Date.now, random = Math.random} = opts;
 const maxRetries = opts.maxRetries ?? 4, minInterval = opts.minIntervalMs ?? 600, cooldown = opts.cooldownMs ?? 5000, timeout = opts.timeoutMs ?? 15000;
 const stats = {requests: 0, retries: 0, rateLimited: 0};
 let deadline: number | null = null, lastCall = 0;
 // Waiting past the deadline would waste the invocation; pause the run instead.
 async function wait(ms: number) {
  if (deadline !== null && now() + ms > deadline) throw new BudgetExceeded();
  if (ms > 0) await sleep(ms);
 }
 const backoff = (attempt: number) => Math.min(30000, 500 * 2 ** attempt) * (0.5 + random() / 2);
 function retryAfter(res: Response) {
  const raw = res.headers.get('retry-after');
  const secs = raw === null ? NaN : Number(raw);
  return Number.isFinite(secs) && secs >= 0 ? Math.min(secs, 120) * 1000 : 60000;
 }
 async function getJson(path: string): Promise<any> {
  for (let attempt = 0; ; attempt++) {
   await wait(Math.max(0, minInterval - (now() - lastCall)));
   lastCall = now();
   stats.requests++;
   let res: Response;
   try {
    res = await fetchImpl(`${baseUrl}${path}`, {headers: {Authorization: `Bearer ${token}`, Accept: 'application/json'}, signal: AbortSignal.timeout(timeout), redirect: 'error', cache: 'no-store'});
   } catch {
    if (attempt >= maxRetries) throw new ShipperError('Network error contacting Shipper', undefined, true);
    stats.retries++; await wait(backoff(attempt)); continue;
   }
   if (res.status === 429) {
    stats.rateLimited++;
    if (attempt >= maxRetries) throw new ShipperError('Shipper rate limit', 429, true);
    stats.retries++; await wait(retryAfter(res)); continue;
   }
   if (res.status >= 500) {
    if (attempt >= maxRetries) throw new ShipperError(`Shipper server error (${res.status})`, res.status, true);
    stats.retries++; await wait(backoff(attempt)); continue;
   }
   if (!res.ok) throw new ShipperError(`Shipper request failed (${res.status})`, res.status, false);
   const remaining = Number(res.headers.get('x-ratelimit-remaining'));
   let body: any;
   try { body = await res.json(); } catch {
    if (attempt >= maxRetries) throw new ShipperError('Shipper returned invalid JSON', res.status, true);
    stats.retries++; await wait(backoff(attempt)); continue;
   }
   if (res.headers.get('x-ratelimit-remaining') !== null && Number.isFinite(remaining) && remaining <= 1) await wait(cooldown);
   return body;
  }
 }
 return {
  stats,
  setDeadline(at) { deadline = at; },
  async listProducts(page, perPage) {
   const body = await getJson(`/products?per_page=${perPage}&page=${page}`);
   if (!Array.isArray(body?.data)) throw new ShipperError('Unexpected catalogue response shape', 200, true);
   const last = Number(body.pagination?.last_page), total = Number(body.pagination?.total);
   return {rows: body.data, lastPage: Number.isInteger(last) && last >= 1 ? last : null, total: Number.isInteger(total) && total >= 0 ? total : null};
  },
 };
}

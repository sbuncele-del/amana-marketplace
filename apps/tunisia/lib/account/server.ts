// Shared plumbing for the account routes: configuration, one database pool, origin check, signed-in customer.
import {Pool} from 'pg';
import {ordersSchema} from '../orders/store';
import {accountSchema, COOKIE_NAME, customerFromToken, readCookie, type Customer} from './auth';

export type AccountConfig = {databaseUrl: string; secret: string; resendKey: string; from: string};
// Accounts open only when there is a database, a signing secret (24+ characters), and a way to email codes.
export function accountConfig(env: Record<string, string | undefined>): AccountConfig | null {
  const databaseUrl = env.TUNISIA_DATABASE_URL || env.DATABASE_URL || env.POSTGRES_URL || '';
  const secret = env.TUNISIA_ACCOUNT_SECRET ?? '', resendKey = env.RESEND_API_KEY ?? '', from = (env.TUNISIA_FROM_EMAIL ?? '').trim();
  return databaseUrl && secret.length >= 24 && resendKey && from ? {databaseUrl, secret, resendKey, from} : null;
}

let pool: Pool | undefined, ready: Promise<unknown> | undefined;
export async function accountDb(cfg: AccountConfig): Promise<Pool> {
  pool ??= new Pool({connectionString: cfg.databaseUrl, max: 2, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000});
  const p = pool;
  await (ready ??= p.query(ordersSchema).then(() => p.query(accountSchema)).catch(e => { ready = undefined; throw e; }));
  return p;
}

export const reply = (status: number, body: Record<string, unknown>, extra?: Record<string, string>) =>
  Response.json(body, {status, headers: {'Cache-Control': 'no-store', ...extra}});

export function badOrigin(request: Request): boolean {
  const origin = request.headers.get('origin'), host = request.headers.get('host');
  if (!origin) return false;
  try { return new URL(origin).host !== host; } catch { return true; }
}

export async function currentCustomer(request: Request, db: Pool): Promise<{customer: Customer; token: string} | null> {
  const token = readCookie(request.headers.get('cookie'));
  const customer = await customerFromToken(db, token);
  return customer && token ? {customer, token} : null;
}
export {COOKIE_NAME};

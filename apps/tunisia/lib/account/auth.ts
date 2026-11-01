// Optional customer accounts for the Tunisia store: passwordless sign-in with a 6-digit email code. Guests can still order.
// Codes and session tokens are stored only as hashes. A code lasts 10 minutes and allows 5 tries; a new one can be asked
// for once a minute. Orders placed with the same email are linked to the account once its owner proves the email.
import {createHash, createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual} from 'node:crypto';
import type {Queryable} from '../orders/store';

export const accountSchema = `CREATE TABLE IF NOT EXISTS public.plentovo_tn_customers (
 id text PRIMARY KEY, email text NOT NULL UNIQUE, name text, phone text, governorate text, delegation text, address text,
 locale text NOT NULL DEFAULT 'fr', consent_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), last_login_at timestamptz);
CREATE TABLE IF NOT EXISTS public.plentovo_tn_login_codes (
 email text PRIMARY KEY, code_hash text NOT NULL, expires_at timestamptz NOT NULL, attempts integer NOT NULL DEFAULT 0, sent_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.plentovo_tn_sessions (
 token_hash text PRIMARY KEY, customer_id text NOT NULL REFERENCES public.plentovo_tn_customers(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.plentovo_tn_orders ADD COLUMN IF NOT EXISTS customer_id text, ADD COLUMN IF NOT EXISTS shipper_status text;
CREATE INDEX IF NOT EXISTS plentovo_tn_orders_customer ON public.plentovo_tn_orders (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS plentovo_tn_orders_email ON public.plentovo_tn_orders ((customer->>'email'));`;

export const CODE_TTL_MINUTES = 10, MAX_TRIES = 5, RESEND_SECONDS = 60, SESSION_DAYS = 30;
export const COOKIE_NAME = 'plentovo_tn_session';

export function normaliseEmail(raw: unknown): string | null {
  const e = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  return e.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const codeHash = (email: string, code: string, secret: string) => createHmac('sha256', secret).update(`${email}:${code}`).digest('hex');
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export type Issued = {status: 'sent'; code: string} | {status: 'wait'; seconds: number};
export async function issueCode(db: Queryable, email: string, secret: string, now = new Date()): Promise<Issued> {
  const prior = (await db.query('SELECT sent_at FROM public.plentovo_tn_login_codes WHERE email=$1', [email])).rows[0];
  if (prior) {
    const age = (now.getTime() - new Date(prior.sent_at).getTime()) / 1000;
    if (age < RESEND_SECONDS) return {status: 'wait', seconds: Math.ceil(RESEND_SECONDS - age)};
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await db.query(
    `INSERT INTO public.plentovo_tn_login_codes(email,code_hash,expires_at,attempts,sent_at) VALUES($1,$2,$3,0,$4)
     ON CONFLICT(email) DO UPDATE SET code_hash=$2,expires_at=$3,attempts=0,sent_at=$4`,
    [email, codeHash(email, code, secret), new Date(now.getTime() + CODE_TTL_MINUTES * 60_000).toISOString(), now.toISOString()]);
  return {status: 'sent', code};
}

export async function checkCode(db: Queryable, email: string, code: string, secret: string, now = new Date()): Promise<boolean> {
  const row = (await db.query('SELECT code_hash,expires_at,attempts FROM public.plentovo_tn_login_codes WHERE email=$1', [email])).rows[0];
  if (!row || row.attempts >= MAX_TRIES || new Date(row.expires_at) <= now) return false;
  if (!/^\d{6}$/.test(code) || !same(row.code_hash, codeHash(email, code, secret))) {
    await db.query('UPDATE public.plentovo_tn_login_codes SET attempts=attempts+1 WHERE email=$1', [email]);
    return false;
  }
  await db.query('DELETE FROM public.plentovo_tn_login_codes WHERE email=$1', [email]);
  return true;
}

export type Customer = {id: string; email: string; name: string; phone: string; governorate: string; delegation: string; address: string; locale: string};
const toCustomer = (r: any): Customer => ({id: r.id, email: r.email, name: r.name ?? '', phone: r.phone ?? '', governorate: r.governorate ?? '', delegation: r.delegation ?? '', address: r.address ?? '', locale: r.locale});
const columns = 'id,email,name,phone,governorate,delegation,address,locale';

// Signing in with a verified code creates the account on first use (consent is recorded then) and claims earlier guest orders.
export async function signInCustomer(db: Queryable, email: string, locale: string, now = new Date()): Promise<Customer> {
  const l = locale === 'en' || locale === 'ar' ? locale : 'fr';
  const row = (await db.query(
    `INSERT INTO public.plentovo_tn_customers(id,email,locale,consent_at,last_login_at) VALUES($1,$2,$3,$4,$4)
     ON CONFLICT(email) DO UPDATE SET last_login_at=$4 RETURNING ${columns}`, [randomUUID(), email, l, now.toISOString()])).rows[0];
  await db.query("UPDATE public.plentovo_tn_orders SET customer_id=$1 WHERE customer_id IS NULL AND customer->>'email'=$2", [row.id, email]);
  return toCustomer(row);
}

export async function createSession(db: Queryable, customerId: string, now = new Date()): Promise<{token: string; expires: Date}> {
  const token = randomBytes(32).toString('base64url'), expires = new Date(now.getTime() + SESSION_DAYS * 86_400_000);
  await db.query('INSERT INTO public.plentovo_tn_sessions(token_hash,customer_id,expires_at) VALUES($1,$2,$3)', [sha(token), customerId, expires.toISOString()]);
  return {token, expires};
}

export async function customerFromToken(db: Queryable, token: string | undefined, now = new Date()): Promise<Customer | null> {
  if (!token || token.length < 30 || token.length > 100) return null;
  const row = (await db.query(
    `SELECT c.${columns.split(',').join(',c.')} FROM public.plentovo_tn_sessions s JOIN public.plentovo_tn_customers c ON c.id=s.customer_id WHERE s.token_hash=$1 AND s.expires_at>$2`,
    [sha(token), now.toISOString()])).rows[0];
  return row ? toCustomer(row) : null;
}

export const endSession = (db: Queryable, token: string) => db.query('DELETE FROM public.plentovo_tn_sessions WHERE token_hash=$1', [sha(token)]);

export function readCookie(header: string | null, name = COOKIE_NAME): string | undefined {
  for (const part of (header ?? '').split(';')) { const [k, ...v] = part.trim().split('='); if (k === name) return v.join('='); }
  return undefined;
}
export const sessionCookie = (token: string, expires: Date) => `${COOKIE_NAME}=${token}; Path=/tunisia; Expires=${expires.toUTCString()}; HttpOnly; Secure; SameSite=Lax`;
export const clearedCookie = `${COOKIE_NAME}=; Path=/tunisia; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;

export type Profile = {name: string; phone: string; governorate: string; delegation: string; address: string};
export async function saveProfile(db: Queryable, customerId: string, p: Profile) {
  await db.query('UPDATE public.plentovo_tn_customers SET name=$2,phone=$3,governorate=$4,delegation=$5,address=$6 WHERE id=$1', [customerId, p.name, p.phone, p.governorate, p.delegation, p.address]);
}

export async function listOrders(db: Queryable, customerId: string) {
  const rows = (await db.query(
    'SELECT reference,status,items,subtotal_millimes,created_at,shipper_status FROM public.plentovo_tn_orders WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 50', [customerId])).rows;
  return rows.map(r => ({reference: r.reference as string, status: orderStage(r.status, r.shipper_status), items: r.items as {title: string; quantity: number}[], totalMillimes: r.subtotal_millimes as number, createdAt: new Date(r.created_at).toISOString()}));
}

// One simple stage for customers, from our status and Shipper's latest.
export type Stage = 'received' | 'confirmed' | 'on_the_way' | 'delivered' | 'cancelled' | 'problem';
export function orderStage(ours: string | null, shipper: string | null): Stage {
  const s = (shipper ?? '').toLowerCase();
  if (s.includes('deliver') && !s.includes('undeliver')) return 'delivered';
  if (s.includes('cancel') || s.includes('refus') || s.includes('return')) return 'cancelled';
  if (s.includes('onitsway') || s.includes('transit') || s.includes('shipped') || s.includes('carrier') || s.includes('out_for')) return 'on_the_way';
  if (s === 'paid' || s.includes('awaitingpackaging') || s.includes('prepar') || s.includes('confirmed')) return 'confirmed';
  if (s === 'rejected' || s === 'needs_review') return 'received';
  return ours === 'CANCELLED' ? 'cancelled' : 'received';
}

// Deletes the account, its sessions and codes. Orders are kept for delivery and accounting records but lose the link and the email.
export async function deleteCustomer(db: Queryable, customerId: string, email: string) {
  await db.query("UPDATE public.plentovo_tn_orders SET customer_id=NULL, customer=customer-'email' WHERE customer_id=$1 OR customer->>'email'=$2", [customerId, email]);
  await db.query('DELETE FROM public.plentovo_tn_login_codes WHERE email=$1', [email]);
  await db.query('DELETE FROM public.plentovo_tn_customers WHERE id=$1', [customerId]); // sessions cascade
}

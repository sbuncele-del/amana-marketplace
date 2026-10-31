// Durable storage for Tunisia cash-on-delivery orders. Idempotent on the browser's request key, so a double click or a
// retry after an email failure never creates a second order.
import {randomBytes, randomUUID} from 'node:crypto';
import type {CodOrder} from './cod';

export type Queryable = {query: (sql: string, params?: unknown[]) => Promise<{rows: any[]}>};

export const ordersSchema = `CREATE TABLE IF NOT EXISTS public.plentovo_tn_orders (
 id text PRIMARY KEY, reference text NOT NULL UNIQUE, request_key text NOT NULL UNIQUE, status text NOT NULL DEFAULT 'PENDING_CONFIRMATION',
 locale text NOT NULL, customer jsonb NOT NULL, items jsonb NOT NULL, subtotal_millimes integer NOT NULL CHECK(subtotal_millimes>0),
 alerted_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS plentovo_tn_orders_phone ON public.plentovo_tn_orders ((customer->>'phone'), created_at DESC);`;

export type Saved = {status: 'created' | 'existing'; reference: string; alerted: boolean} | {status: 'rate_limited'};

export async function saveOrder(db: Queryable, o: CodOrder, hourlyLimit = 3): Promise<Saved> {
  const prior = (await db.query('SELECT reference,alerted_at FROM public.plentovo_tn_orders WHERE request_key=$1', [o.requestKey])).rows[0];
  if (prior) return {status: 'existing', reference: prior.reference, alerted: !!prior.alerted_at};
  const recent = Number((await db.query("SELECT count(*)::int AS n FROM public.plentovo_tn_orders WHERE customer->>'phone'=$1 AND created_at>now()-interval '1 hour'", [o.phone])).rows[0].n);
  if (recent >= hourlyLimit) return {status: 'rate_limited'};
  const reference = `TN-${randomBytes(4).toString('hex').toUpperCase()}`;
  const customer = {name: o.name, phone: o.phone, governorate: o.governorate, delegation: o.delegation, address: o.address, notes: o.notes};
  const r = await db.query(
    'INSERT INTO public.plentovo_tn_orders(id,reference,request_key,locale,customer,items,subtotal_millimes) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(request_key) DO NOTHING RETURNING reference',
    [randomUUID(), reference, o.requestKey, o.locale, JSON.stringify(customer), JSON.stringify(o.items), o.subtotalMillimes]);
  if (r.rows[0]) return {status: 'created', reference, alerted: false};
  const again = (await db.query('SELECT reference,alerted_at FROM public.plentovo_tn_orders WHERE request_key=$1', [o.requestKey])).rows[0];
  return {status: 'existing', reference: again.reference, alerted: !!again.alerted_at};
}

export const markAlerted = (db: Queryable, reference: string) => db.query('UPDATE public.plentovo_tn_orders SET alerted_at=now() WHERE reference=$1', [reference]);

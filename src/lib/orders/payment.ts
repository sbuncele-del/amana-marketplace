// Records a verified Payfast payment on the order, once. Everything is re-checked on the locked row.
import {randomUUID} from 'node:crypto';
import type {Queryable} from './notify';

export type Tx = <T>(work: (client: Queryable) => Promise<T>) => Promise<T>;
export type Awaiting = {id: string; totalCents: number};
export type PaymentResult =
  | {status: 'paid'; id: string} | {status: 'already_paid'; id: string}
  | {status: 'not_found'} | {status: 'not_awaiting'} | {status: 'amount_mismatch'};

/** The order a notification is claiming to pay for, if it is a checkout order still awaiting payment. */
export async function findAwaiting(reference: string, tx: Tx): Promise<{id: string; totalCents: number; paid: boolean} | null> {
  return tx(async c => {
    const r = (await c.query("SELECT id,status,data FROM experience_records WHERE reference=$1 AND kind='ORDER'", [reference])).rows[0];
    if (!r || r.data?.paymentProvider !== 'PAYFAST' || !Number.isInteger(r.data?.totalCents)) return null;
    return {id: r.id, totalCents: r.data.totalCents, paid: r.data.paymentVerified === true};
  });
}

export async function recordPayment(
  reference: string, payment: {paymentRef: string; grossCents: number; feeCents: number | null; netCents: number | null; mode: string},
  tx: Tx, now = new Date(),
): Promise<PaymentResult> {
  return tx(async c => {
    const r = (await c.query("SELECT id,status,data FROM experience_records WHERE reference=$1 AND kind='ORDER' FOR UPDATE", [reference])).rows[0];
    if (!r || r.data?.paymentProvider !== 'PAYFAST') return {status: 'not_found'} as const;
    if (r.data.paymentVerified === true) return {status: 'already_paid', id: r.id} as const;
    if (r.status !== 'CONFIRMED' || r.data.awaitingPayment !== true) return {status: 'not_awaiting'} as const;
    if (r.data.totalCents !== payment.grossCents) return {status: 'amount_mismatch'} as const;
    const patch = {awaitingPayment: false, paymentVerified: true, paymentRef: payment.paymentRef, paidAt: now.toISOString(), paymentMode: payment.mode, payfastFeeCents: payment.feeCents, payfastNetCents: payment.netCents};
    await c.query("UPDATE experience_records SET status='PAID', data=data||$2::jsonb, version=version+1, updated_at=now() WHERE id=$1", [r.id, JSON.stringify(patch)]);
    await c.query('INSERT INTO experience_events(id,record_id,actor_id,type,note,data) VALUES($1,$2,NULL,$3,$4,$5)',
      [randomUUID(), r.id, 'PAYMENT_VERIFIED', `Payfast payment ${payment.paymentRef} verified`, JSON.stringify({grossCents: payment.grossCents, mode: payment.mode})]);
    return {status: 'paid', id: r.id} as const;
  });
}

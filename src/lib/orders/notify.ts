// Sends the fulfilment alert once per verified-paid order. Dependencies are injected so the
// logic is testable without a database or email provider; notify-live.ts wires the real ones.
import {randomUUID} from 'node:crypto';
import {buildAlert, parsePaidOrder, type FeeConfig} from './paid-order';

export type Queryable = {query: (sql: string, params?: unknown[]) => Promise<{rows: any[]; rowCount?: number | null}>};
export type Deps = {
  transaction: <T>(work: (client: Queryable) => Promise<T>) => Promise<T>;
  send: (mail: {to: string; subject: string; html: string; idempotencyKey: string}) => Promise<string>;
  recipients: string[]; fees: FeeConfig;
};
export type NotifyResult =
  | {status: 'sent'; recipients: number; resend: boolean}
  | {status: 'already_sent'}
  | {status: 'not_found'}
  | {status: 'not_eligible'; reason: string}
  | {status: 'invalid_order'; problems: string[]}
  | {status: 'not_configured'}
  | {status: 'send_failed'; error: string};

export const SENT = 'FULFILMENT_ALERT_SENT', FAILED = 'FULFILMENT_ALERT_FAILED';

export function recipientsFrom(value: string | undefined) {
  return [...new Set((value ?? '').split(/[,;\s]+/).map(s => s.trim().toLowerCase()).filter(s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)))];
}
export function feesFrom(env: Record<string, string | undefined>): FeeConfig {
  const n = (v: string | undefined) => (v !== undefined && v.trim() !== '' && Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : null);
  return {percent: n(env.PAYFAST_FEE_PERCENT), fixedCents: n(env.PAYFAST_FEE_FIXED_CENTS)};
}

// Call this only after the payment provider has been verified server-side and the record is PAID.
// It never trusts the caller: eligibility is re-read from the locked order row.
export async function notifyPaidOrder(orderId: string, opts: {force?: boolean; actor?: string | null}, deps: Deps): Promise<NotifyResult> {
  if (!deps.recipients.length) return {status: 'not_configured'};
  return deps.transaction(async client => {
    const row = (await client.query("SELECT id,reference,status,data FROM experience_records WHERE id=$1 AND kind='ORDER' FOR UPDATE", [orderId])).rows[0];
    if (!row) return {status: 'not_found'} as const;
    if (!['PAID', 'FULFILMENT'].includes(row.status) || row.data?.paymentVerified !== true) return {status: 'not_eligible', reason: 'The order is not confirmed paid.'} as const;
    const prior = Number((await client.query('SELECT count(*)::int AS n FROM experience_events WHERE record_id=$1 AND type=$2', [row.id, SENT])).rows[0].n);
    if (prior > 0 && !opts.force) return {status: 'already_sent'} as const;
    const parsed = parsePaidOrder(row);
    if (!parsed.ok) return {status: 'invalid_order', problems: parsed.problems} as const;
    const alert = buildAlert(parsed.value, deps.fees, prior > 0);
    try {
      // The key makes a retry after a crash harmless; it changes per deliberate resend.
      for (const [i, to] of deps.recipients.entries()) await deps.send({to, subject: alert.subject, html: alert.html, idempotencyKey: `paid-order-${row.id}-${prior}-${i}`});
    } catch (e) {
      const error = e instanceof Error ? e.message.slice(0, 300) : 'Email send failed';
      await client.query('INSERT INTO experience_events(id,record_id,actor_id,type,note,data) VALUES($1,$2,$3,$4,$5,$6)', [randomUUID(), row.id, opts.actor ?? null, FAILED, 'Fulfilment alert could not be sent', JSON.stringify({error})]);
      return {status: 'send_failed', error} as const;
    }
    await client.query('INSERT INTO experience_events(id,record_id,actor_id,type,note,data) VALUES($1,$2,$3,$4,$5,$6)', [randomUUID(), row.id, opts.actor ?? null, SENT, prior > 0 ? 'Fulfilment alert re-sent' : 'Fulfilment alert emailed', JSON.stringify({recipients: deps.recipients.length, resend: prior > 0})]);
    return {status: 'sent', recipients: deps.recipients.length, resend: prior > 0} as const;
  });
}

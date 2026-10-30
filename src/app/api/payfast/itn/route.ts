import {NextRequest, NextResponse} from 'next/server';
import {lookup} from 'node:dns/promises';
import {transaction} from '@/lib/experience/store';
import {payfastConfig} from '@/lib/payfast/config';
import {claimedReference, verifyItn} from '@/lib/payfast/itn';
import {findAwaiting, recordPayment} from '@/lib/orders/payment';
import {notifyPaidOrderLive} from '@/lib/orders/notify-live';
import type {Queryable} from '@/lib/orders/notify';

const tx = <T,>(work: (c: Queryable) => Promise<T>) => transaction(client => work(client as unknown as Queryable));
const reply = (status: number, text: string) => new NextResponse(text, {status, headers: {'Cache-Control': 'no-store'}});

// Payfast's server-to-server notification. The browser's return page proves nothing; only this does, and only after
// the signature, source, amount and Payfast's own confirmation have all been checked.
// 200 = handled (do not retry), 400 = rejected for good, 503 = please retry.
export async function POST(request: NextRequest) {
  const cfg = payfastConfig(process.env);
  if (!cfg) return reply(503, 'Not enabled');
  const raw = await request.text();
  if (raw.length > 5000) return reply(400, 'Too large');
  const reference = claimedReference(raw);
  if (!reference) return reply(400, 'Missing reference');
  try {
    const order = await findAwaiting(reference, tx);
    if (!order) return reply(400, 'Unknown order');
    if (order.paid) return reply(200, 'OK');
    const sourceIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip');
    const result = await verifyItn({rawBody: raw, sourceIp, expected: {reference, totalCents: order.totalCents}}, cfg, {
      resolveIps: async host => (await lookup(host, {all: true})).map(a => a.address),
      postValidate: async (url, body) => (await fetch(url, {method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body, cache: 'no-store', signal: AbortSignal.timeout(8000)})).text(),
    });
    if (!result.ok) {
      console.warn('[payfast] notification not accepted', {reference, kind: result.kind, reason: result.reason});
      return result.kind === 'unavailable' ? reply(503, 'Retry') : result.kind === 'not_complete' ? reply(200, 'OK') : reply(400, 'Rejected');
    }
    const paid = await recordPayment(reference, {...result, mode: cfg.mode}, tx);
    if (paid.status === 'paid') {
      // A failed alert must not fail the payment record; staff can resend from the operations route.
      await notifyPaidOrderLive(paid.id).then(r => { if (r.status !== 'sent') console.error('[payfast] fulfilment alert not sent', {reference, status: r.status}); }).catch(e => console.error('[payfast] fulfilment alert failed', e));
    }
    return paid.status === 'paid' || paid.status === 'already_paid' ? reply(200, 'OK') : reply(400, 'Not accepted');
  } catch (e) {
    console.error('[payfast] notification error', e);
    return reply(503, 'Retry');
  }
}

import {after, NextRequest, NextResponse} from 'next/server';
import {event, recordFromRow, transaction} from '@/lib/experience/store';
import {queueOrderEmail, sendOrderEmail} from '@/lib/mail/order-updates';
import {getOzowTransaction, ozowConfig, verifyOzowWebhook} from '@/lib/ozow';

export const maxDuration = 30;
const ack = (body: object = {received: true}, status = 200) => NextResponse.json(body, {status, headers: {'Cache-Control': 'no-store'}});

// Ozow (Svix) delivers transaction.complete / refund.complete here. We verify the signature, then
// ask Ozow for the transaction itself and only then mark the order paid. The webhook body is
// only used to learn which transaction to look up.
export async function POST(request: NextRequest) {
  const config = ozowConfig();
  if (!config) return ack({error: 'Ozow payments are not enabled.'}, 503);
  const raw = await request.text();
  if (!verifyOzowWebhook(raw, request.headers, config.webhookSecret)) {
    console.warn('Ozow webhook rejected: bad signature');
    return ack({error: 'Invalid signature.'}, 401);
  }
  let envelope: {event_type?: string; data?: Record<string, unknown>};
  try { envelope = JSON.parse(raw); } catch { return ack({error: 'Invalid body.'}, 400); }
  if (envelope.event_type !== 'transaction.complete') return ack(); // pings, refunds: nothing to do automatically
  const data = envelope.data ?? {};
  const transactionId = String(data.id ?? data.TransactionId ?? '');

  try {
    const tx = await getOzowTransaction(config, transactionId);
    if (!tx || tx.siteCode !== config.siteCode) { console.warn('Ozow webhook: unknown transaction', transactionId); return ack(); }

    const emailJob = await transaction(async client => {
      const row = (await client.query(
        "SELECT * FROM experience_records WHERE kind='ORDER' AND reference=$1 AND data->>'paymentMethod'='OZOW' FOR UPDATE",
        [tx.merchantReference],
      )).rows[0];
      if (!row) { console.warn('Ozow webhook: no order for reference', tx.merchantReference); return null; }
      const order = recordFromRow(row);
      if (tx.status !== 'Successful') {
        if (order.status === 'CONFIRMED') await event(client, order.id, null, 'OZOW_PAYMENT_NOT_COMPLETED', `Ozow reported ${tx.status}${tx.reason ? `: ${tx.reason}` : ''}. The order stays unpaid.`);
        return null;
      }
      if (order.status === 'CANCELLED') {
        await event(client, order.id, null, 'OZOW_PAID_AFTER_CANCEL', `Ozow transaction ${tx.id} succeeded after cancellation. Refund the customer.`);
        return null;
      }
      if (order.status !== 'CONFIRMED') return null; // already paid or further along: duplicate delivery
      const expected = Number(order.data.subtotalCents) + Number(order.data.shippingCents ?? 0);
      const paid = Math.round(Number(tx.amount?.value) * 100);
      if (tx.amount?.currency !== 'ZAR' || !Number.isSafeInteger(paid) || paid !== expected) {
        await event(client, order.id, null, 'OZOW_AMOUNT_MISMATCH', `Ozow transaction ${tx.id} amount ${tx.amount?.currency} ${tx.amount?.value} does not match the order total. Not marked paid; review manually.`);
        return null;
      }
      const data = {...order.data, paymentReference: tx.id, ozowTransactionId: tx.id, paidAt: new Date().toISOString()};
      const updated = (await client.query(
        "UPDATE experience_records SET status='PAID',data=$2,version=version+1,updated_at=now() WHERE id=$1 RETURNING *",
        [order.id, JSON.stringify(data)],
      )).rows[0];
      await event(client, order.id, null, 'STATUS_CHANGED', `Paid by Ozow Pay by Bank (transaction ${tx.id}), verified against Ozow before recording.`, {from: 'CONFIRMED', to: 'PAID'});
      return queueOrderEmail(client, recordFromRow(updated));
    });
    if (emailJob) after(async () => { await sendOrderEmail(emailJob).catch(() => console.error('Order email queued for retry')); });
    return ack();
  } catch (error) {
    console.error('Ozow webhook failed', error instanceof Error ? error.message : error);
    return ack({error: 'Temporary failure.'}, 500); // Svix retries
  }
}

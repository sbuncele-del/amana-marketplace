import 'server-only';
import {randomUUID} from 'node:crypto';
import type {PoolClient} from 'pg';
import {z} from 'zod';
import {event, experiencePool, transaction} from '@/lib/experience/store';
import {orderMilestones, orderMilestoneEmail} from './order-templates';
import {orderMailAddresses} from './order-addresses';
import {mailConfigured, sendMail} from './send';

export async function queueOrderEmail(
  client: PoolClient,
  order: {id: string; reference: string; status: string; data: Record<string, unknown>},
) {
  if (!Object.hasOwn(orderMilestones, order.status)) return null;
  const milestone = order.status as keyof typeof orderMilestones;
  const {label, subject, html} = orderMilestoneEmail(milestone, order.reference, {
    name: typeof order.data.notificationName === 'string' ? order.data.notificationName
      : typeof order.data.customerName === 'string' ? order.data.customerName : undefined,
    trackingUrl: typeof order.data.trackingUrl === 'string' ? order.data.trackingUrl : undefined,
    collection: order.data.deliveryMethod === 'COLLECTION',
    trackingNumber: typeof order.data.trackingNumber === 'string' ? order.data.trackingNumber : undefined,
  });
  const recipient = z.string().trim().email().safeParse(order.data.email);
  if (!recipient.success) {
    await event(client, order.id, null, 'CUSTOMER_EMAIL_SKIPPED', `${label}: no valid customer email on the order.`);
    return null;
  }
  const id = randomUUID();
  const {rowCount} = await client.query(
    'INSERT INTO experience_order_emails(id,order_id,milestone,recipient,subject,html,sender,reply_to) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(order_id,milestone) DO NOTHING',
    [id, order.id, milestone, recipient.data, subject, html, orderMailAddresses.from, orderMailAddresses.replyTo],
  );
  if (!rowCount) return null;
  await event(client, order.id, null, 'CUSTOMER_EMAIL_QUEUED', `${label} email queued.`);
  return id;
}

export async function sendOrderEmail(id?: string) {
  const {rows: [job]} = await experiencePool().query(
    `WITH next AS (
       SELECT id FROM experience_order_emails WHERE ($1::text IS NULL OR id=$1)
         AND ((status='QUEUED' AND due_at<=now()) OR (status='SENDING' AND claimed_at<now()-interval '5 minutes'))
       ORDER BY due_at,id LIMIT 1 FOR UPDATE SKIP LOCKED
     ) UPDATE experience_order_emails j SET status='SENDING',claimed_at=now(),attempts=attempts+1,
         first_attempt_at=coalesce(first_attempt_at,now())
       FROM next WHERE j.id=next.id RETURNING j.*`,
    [id ?? null],
  );
  if (!job) return false;
  let providerId: string | null = null;
  // Stop before the provider's idempotency window can expire after an uncertain send.
  const expired = Date.now() - new Date(job.first_attempt_at).getTime() >= 20 * 3600_000;
  if (!expired && job.attempts <= 4 && mailConfigured(job.sender ?? undefined)) {
    try {
      providerId = await sendMail({
        to: job.recipient, subject: job.subject, html: job.html,
        from: job.sender ?? undefined, replyTo: job.reply_to ?? undefined,
        idempotencyKey: `order-update-${job.id}`, tags: {type: 'order-update', milestone: job.milestone.toLowerCase()},
      });
    } catch {
      // The next scheduled attempt uses the same key and payload.
    }
  }
  const state = providerId ? 'SENT' : expired || job.attempts >= 4 ? 'FAILED' : 'QUEUED';
  await transaction(async client => {
    const {rowCount} = await client.query(
      `UPDATE experience_order_emails SET status=$2,provider_id=$3,due_at=now()+interval '5 minutes'
       WHERE id=$1 AND status='SENDING' AND attempts=$4`,
      [job.id, state, providerId, job.attempts],
    );
    if (!rowCount || state === 'QUEUED') return;
    const title = job.subject.split(' | Plentovo ')[0];
    await event(client, job.order_id, null, state === 'SENT' ? 'CUSTOMER_EMAIL_SENT' : 'CUSTOMER_EMAIL_FAILED',
      state === 'SENT' ? `${title} email accepted by the email provider.` : `${title} email could not be confirmed after retries.`);
  });
  return true;
}

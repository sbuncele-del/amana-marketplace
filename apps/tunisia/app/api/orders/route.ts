import {Pool} from 'pg';
import {codConfig} from '@/lib/orders/config';
import {checkCodOrder, codAlert} from '@/lib/orders/cod';
import {markAlerted, ordersSchema, saveOrder} from '@/lib/orders/store';
import {getLiveProducts} from '@/lib/shipper-catalogue';

const headers = {'Cache-Control': 'no-store'};
const reply = (status: number, body: Record<string, unknown>) => Response.json(body, {status, headers});
let pool: Pool | undefined, ready: Promise<unknown> | undefined;

// Cash-on-delivery order request. Takes no payment. The server re-reads prices and stock, saves the order, and emails the
// team to call the customer. Stays closed (503) unless ordering is fully configured; see lib/orders/config.ts.
export async function POST(request: Request) {
  const cfg = codConfig(process.env);
  if (!cfg) return reply(503, {code: 'TUNISIA_CHECKOUT_NOT_OPEN', message: 'Tunisia orders are not open yet.'});
  const origin = request.headers.get('origin'), host = request.headers.get('host');
  if (origin) { try { if (new URL(origin).host !== host) return reply(403, {code: 'BAD_ORIGIN'}); } catch { return reply(403, {code: 'BAD_ORIGIN'}); } }
  const raw = await request.text();
  if (raw.length > 12000) return reply(413, {code: 'TOO_LARGE'});
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { return reply(400, {code: 'INVALID_DETAILS'}); }
  if (body.website) return reply(400, {code: 'INVALID_DETAILS'}); // hidden field only bots fill in
  try {
    const checked = checkCodOrder(body, await getLiveProducts());
    if (!checked.ok) return reply(checked.code === 'OUT_OF_STOCK' ? 409 : 422, {code: checked.code, field: checked.field});
    pool ??= new Pool({connectionString: cfg.databaseUrl, max: 2, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000});
    await (ready ??= pool.query(ordersSchema).catch(e => { ready = undefined; throw e; }));
    const saved = await saveOrder(pool, checked.order);
    if (saved.status === 'rate_limited') return reply(429, {code: 'RATE_LIMITED'});
    if (!saved.alerted) {
      const mail = codAlert(saved.reference, checked.order);
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(10000),
        headers: {Authorization: `Bearer ${cfg.resendKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `tn-order-${saved.reference}`},
        body: JSON.stringify({from: cfg.from, to: cfg.to, subject: mail.subject, html: mail.html, tags: [{name: 'type', value: 'tn-cod-order'}]}),
      });
      // The order is safely stored; asking the customer to retry re-sends the alert without creating a second order.
      if (!r.ok) { console.error('[tn-orders] alert email failed', r.status); return reply(503, {code: 'TEMPORARY'}); }
      await markAlerted(pool, saved.reference);
    }
    return reply(201, {reference: saved.reference, totalMillimes: checked.order.subtotalMillimes});
  } catch (e) {
    console.error('[tn-orders] failed', e instanceof Error ? e.message : e);
    return reply(503, {code: 'TEMPORARY'});
  }
}

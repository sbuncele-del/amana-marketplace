import {Pool} from 'pg';
import {applyShipperEvent, parseShipperEvent, verifyShipperSignature} from '@/lib/orders/shipper-orders';
import {ordersSchema} from '@/lib/orders/store';

const headers = {'Cache-Control': 'no-store'};
const reply = (status: number, body: Record<string, unknown>) => Response.json(body, {status, headers});
let pool: Pool | undefined, ready: Promise<unknown> | undefined;

// Shipper status updates (order and shipment). Signed with HMAC-SHA256 of the raw body in X-Shipper-Signature.
// Closed (503) until TUNISIA_SHIPPER_WEBHOOK_SECRET is set.
export async function POST(request: Request) {
  const secret = process.env.TUNISIA_SHIPPER_WEBHOOK_SECRET;
  if (!secret) return reply(503, {code: 'WEBHOOK_NOT_CONFIGURED'});
  const body = await request.text();
  if (body.length > 100000) return reply(413, {code: 'TOO_LARGE'});
  if (!verifyShipperSignature(body, request.headers.get('x-shipper-signature'), secret)) return reply(400, {code: 'INVALID_SIGNATURE'});
  const event = parseShipperEvent(body);
  if (!event) return reply(200, {received: true, ignored: true}); // unknown event types must not make Shipper retry and disable the hook
  const databaseUrl = process.env.TUNISIA_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!databaseUrl) return reply(503, {code: 'TEMPORARY'});
  try {
    pool ??= new Pool({connectionString: databaseUrl, max: 2, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000});
    await (ready ??= pool.query(ordersSchema).catch(e => { ready = undefined; throw e; }));
    const r = await applyShipperEvent(pool, event);
    return reply(200, {received: true, updated: r.rows.length});
  } catch (error) {
    console.error('[tn-shipper] webhook store failed', error);
    return reply(500, {code: 'TEMPORARY'});
  }
}

// Sends a saved Tunisia cash-on-delivery order to Shipper (which phones the customer, then fulfils) and records where it is. Off unless TUNISIA_SHIPPER_SUBMIT=true.
// Shipper's API has no idempotency key, so a submission is claimed in the database first and is never retried blindly:
// a timeout or server error could mean Shipper already has the order, so that case is flagged for a person to check.
import {createHmac, timingSafeEqual} from 'node:crypto';
import type {CodOrder} from './cod';
import type {Queryable} from './store';

export type ShipperConfig = {apiKey: string; storeName: string; confirm: boolean; autoFulfill: boolean; shippingTnd: number};

export function shipperConfig(env: Record<string, string | undefined>): ShipperConfig | null {
  if (env.TUNISIA_SHIPPER_SUBMIT !== 'true') return null;
  const apiKey = env.SHIPPER_NETWORK_API_KEY || env.TUNISIA_SHIPPER_API_KEY || '';
  const shipping = Number(env.TUNISIA_SHIPPING_FEE_TND ?? 0);
  if (!apiKey || !Number.isFinite(shipping) || shipping < 0) return null;
  const confirm = env.TUNISIA_SHIPPER_CONFIRMATION !== 'false';
  // Shipper phones the customer, then fulfils. Never fulfil automatically unless Shipper does that confirming call.
  return {apiKey, storeName: env.TUNISIA_SHIPPER_STORE_NAME || 'Plentovo Tunisia', confirm, autoFulfill: confirm && env.TUNISIA_SHIPPER_AUTOFULFILL !== 'false', shippingTnd: shipping};
}

// Shipper wants division names exactly as in GET /countries/TN/divisions. Governorate comes from our fixed list; the
// delegation is free text on our form, so it goes in the address line instead of risking a rejected order.
export function buildShipperOrder(reference: string, o: CodOrder, cfg: ShipperConfig) {
  return {
    address: {name: o.name, phone1: o.phone.replace(/^\+216/, ''), address1: o.address, address2: o.delegation, division_1: o.governorate, division_2: null, country: 'TN'},
    items: o.items.map(i => ({id: i.id, quantity: i.quantity, total_price: (i.unitMillimes * i.quantity) / 1000})),
    shipping_total: cfg.shippingTnd,
    is_cod: true,
    auto_fulfill: cfg.autoFulfill,
    with_confirmation: cfg.confirm,
    store_name: cfg.storeName,
    external_order_id: reference,
  };
}

export type SubmitResult = {status: 'sent'; shipperOrderId: string} | {status: 'skipped'} | {status: 'rejected' | 'unknown'; detail: string};

export async function submitToShipper(db: Queryable, cfg: ShipperConfig, reference: string, o: CodOrder, fetchFn: typeof fetch = fetch): Promise<SubmitResult> {
  const claim = await db.query('UPDATE public.plentovo_tn_orders SET shipper_claimed_at=now() WHERE reference=$1 AND shipper_order_id IS NULL AND shipper_claimed_at IS NULL RETURNING reference', [reference]);
  if (!claim.rows[0]) return {status: 'skipped'};
  const record = (status: string, error: string | null, id: string | null = null) =>
    db.query('UPDATE public.plentovo_tn_orders SET shipper_order_id=$2, shipper_status=$3, shipper_error=$4, shipper_updated_at=now() WHERE reference=$1', [reference, id, status, error]);
  let response: Response;
  try {
    response = await fetchFn('https://server.shipper.network/api/v1/orders', {
      method: 'POST', signal: AbortSignal.timeout(15000), redirect: 'error',
      headers: {Authorization: `Bearer ${cfg.apiKey}`, Accept: 'application/json', 'Content-Type': 'application/json'},
      body: JSON.stringify(buildShipperOrder(reference, o, cfg)),
    });
  } catch (e) {
    const detail = `no answer from Shipper (${e instanceof Error ? e.message : 'error'}); it may have the order`;
    await record('needs_review', detail);
    return {status: 'unknown', detail};
  }
  if (response.status === 201) {
    const body = await response.json().catch(() => ({})) as {id?: unknown};
    if (body.id !== undefined && body.id !== null) { await record('submitted', null, String(body.id)); return {status: 'sent', shipperOrderId: String(body.id)}; }
    await record('needs_review', 'Shipper accepted the order but returned no id');
    return {status: 'unknown', detail: 'Shipper accepted the order but returned no id'};
  }
  const text = (await response.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 300);
  if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
    const detail = `Shipper refused the order (${response.status}): ${text}`;
    await record('rejected', detail);
    return {status: 'rejected', detail};
  }
  const detail = `Shipper error ${response.status}; it may have the order: ${text}`;
  await record('needs_review', detail);
  return {status: 'unknown', detail};
}

export function verifyShipperSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac('sha256', secret).update(body).digest();
  const given = Buffer.from(signature.trim(), 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export type ShipperEvent = {orderId: string; status: string; at: Date};
export function parseShipperEvent(body: string): ShipperEvent | null {
  try {
    const e = JSON.parse(body) as {event?: unknown; timestamp?: unknown; data?: {order_id?: unknown; status?: unknown}};
    const orderId = e.data?.order_id, status = e.data?.status, at = new Date(String(e.timestamp));
    if ((e.event !== 'order.status_changed' && e.event !== 'shipment.status_changed') || typeof status !== 'string' || !status || (typeof orderId !== 'number' && typeof orderId !== 'string') || Number.isNaN(at.getTime())) return null;
    return {orderId: String(orderId), status: e.event === 'shipment.status_changed' ? `shipment:${status}` : status, at};
  } catch { return null; }
}

// Events can arrive out of order or twice; only a newer one changes the stored status.
export const applyShipperEvent = (db: Queryable, e: ShipperEvent) =>
  db.query('UPDATE public.plentovo_tn_orders SET shipper_status=$2, shipper_updated_at=$3 WHERE shipper_order_id=$1 AND (shipper_updated_at IS NULL OR shipper_updated_at < $3) RETURNING reference', [e.orderId, e.status, e.at.toISOString()]);

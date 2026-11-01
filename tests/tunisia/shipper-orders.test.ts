import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHmac} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {checkCodOrder, type PricedProduct} from '../../apps/tunisia/lib/orders/cod';
import {ordersSchema, saveOrder, type Queryable} from '../../apps/tunisia/lib/orders/store';
import {applyShipperEvent, buildShipperOrder, parseShipperEvent, shipperConfig, submitToShipper, verifyShipperSignature} from '../../apps/tunisia/lib/orders/shipper-orders';

const products: PricedProduct[] = [{id: 'uuid-1', title: {en: 'Air fryer', fr: 'Friteuse', ar: 'قلاية'}, priceMillimes: 249000, stock: 5, active: true}];
const input = {requestKey: 'a'.repeat(20), locale: 'fr', name: 'Amine Ben Salah', phone: '+216 98 123 456', governorate: 'Tunis', delegation: 'La Marsa', address: '12 Rue de la Paix', notes: '', lines: [{id: 'uuid-1', quantity: 2}]};
const cfg = {apiKey: 'k', storeName: 'Plentovo Tunisia', confirm: true, autoFulfill: true, shippingTnd: 9};
async function setup() {
  const pg = new PGlite(); const db: Queryable = {query: (sql, params) => pg.query(sql, params as never[]) as never};
  await pg.exec(ordersSchema);
  const r = checkCodOrder(input, products); assert.ok(r.ok); if (!r.ok) throw new Error();
  const saved = await saveOrder(db, r.order); assert.equal(saved.status, 'created'); if (saved.status !== 'created') throw new Error();
  return {db, order: r.order, reference: saved.reference};
}
const answer = (status: number, body: unknown): typeof fetch => async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), {status});
const row = async (db: Queryable, ref: string) => (await db.query('SELECT shipper_order_id,shipper_status,shipper_error FROM public.plentovo_tn_orders WHERE reference=$1', [ref])).rows[0];

test('submitting is off unless switched on with a key', () => {
  assert.equal(shipperConfig({}), null);
  assert.equal(shipperConfig({TUNISIA_SHIPPER_SUBMIT: 'true'}), null);
  assert.equal(shipperConfig({TUNISIA_SHIPPER_SUBMIT: 'yes', SHIPPER_NETWORK_API_KEY: 'k'}), null);
  assert.deepEqual(shipperConfig({TUNISIA_SHIPPER_SUBMIT: 'true', TUNISIA_SHIPPER_API_KEY: 'k', TUNISIA_SHIPPING_FEE_TND: '9'}), {apiKey: 'k', storeName: 'Plentovo Tunisia', confirm: true, autoFulfill: true, shippingTnd: 9});
  assert.equal(shipperConfig({TUNISIA_SHIPPER_SUBMIT: 'true', SHIPPER_NETWORK_API_KEY: 'k', TUNISIA_SHIPPING_FEE_TND: '-1'}), null);
  // If our own staff do the confirming, nothing may be fulfilled automatically.
  assert.deepEqual([shipperConfig({TUNISIA_SHIPPER_SUBMIT: 'true', SHIPPER_NETWORK_API_KEY: 'k', TUNISIA_SHIPPER_CONFIRMATION: 'false'})?.confirm, shipperConfig({TUNISIA_SHIPPER_SUBMIT: 'true', SHIPPER_NETWORK_API_KEY: 'k', TUNISIA_SHIPPER_CONFIRMATION: 'false'})?.autoFulfill], [false, false]);
});
test('the Shipper order is cash on delivery, confirmed by Shipper then fulfilled, with local phone and line totals in TND', async () => {
  const {order, reference} = await setup();
  const p = buildShipperOrder(reference, order, cfg);
  assert.equal(p.is_cod, true); assert.equal(p.auto_fulfill, true); assert.equal(p.with_confirmation, true);
  assert.equal(p.address.phone1, '98123456'); assert.equal(p.address.division_1, 'Tunis'); assert.equal(p.address.address2, 'La Marsa'); assert.equal(p.address.country, 'TN');
  assert.deepEqual(p.items, [{id: 'uuid-1', quantity: 2, total_price: 498}]);
  assert.equal(p.external_order_id, reference); assert.equal(p.shipping_total, 9);
});
test('a successful submission records Shipper\'s id and is never sent twice', async () => {
  const {db, order, reference} = await setup(); let calls = 0;
  const f: typeof fetch = async (...a) => { calls++; return answer(201, {id: 555})(...a); };
  assert.deepEqual(await submitToShipper(db, cfg, reference, order, f), {status: 'sent', shipperOrderId: '555'});
  assert.deepEqual(await submitToShipper(db, cfg, reference, order, f), {status: 'skipped'});
  assert.equal(calls, 1); assert.deepEqual(await row(db, reference), {shipper_order_id: '555', shipper_status: 'submitted', shipper_error: null});
});
test('a refusal is recorded and not retried; a timeout or 500 is flagged for a person, not retried', async () => {
  const a = await setup();
  const r1 = await submitToShipper(a.db, cfg, a.reference, a.order, answer(422, {error: 'Unknown product'}));
  assert.equal(r1.status, 'rejected'); assert.equal((await row(a.db, a.reference)).shipper_status, 'rejected');
  assert.equal((await submitToShipper(a.db, cfg, a.reference, a.order, answer(201, {id: 1}))).status, 'skipped');
  const b = await setup();
  assert.equal((await submitToShipper(b.db, cfg, b.reference, b.order, async () => { throw new Error('timeout'); })).status, 'unknown');
  assert.equal((await row(b.db, b.reference)).shipper_status, 'needs_review');
  const c = await setup();
  assert.equal((await submitToShipper(c.db, cfg, c.reference, c.order, answer(500, 'oops'))).status, 'unknown');
  assert.equal((await submitToShipper(c.db, cfg, c.reference, c.order, answer(201, {id: 2}))).status, 'skipped');
});
test('webhook signatures are checked and events parsed', () => {
  const body = JSON.stringify({event: 'shipment.status_changed', timestamp: '2026-11-02T10:00:00.000000Z', data: {order_id: 555, shipment_uuid: 'u', status: 'delivered', previous_status: 'onitsway'}});
  const sig = createHmac('sha256', 's3cret').update(body).digest('hex');
  assert.equal(verifyShipperSignature(body, sig, 's3cret'), true);
  assert.equal(verifyShipperSignature(body + ' ', sig, 's3cret'), false);
  assert.equal(verifyShipperSignature(body, sig, 'other'), false);
  assert.equal(verifyShipperSignature(body, null, 's3cret'), false);
  assert.equal(verifyShipperSignature(body, 'zz', 's3cret'), false);
  assert.deepEqual(parseShipperEvent(body)?.status, 'shipment:delivered');
  assert.equal(parseShipperEvent('{"event":"something.else","data":{}}'), null);
  assert.equal(parseShipperEvent('nope'), null);
});
test('status updates apply once and an older event never overwrites a newer one', async () => {
  const {db, order, reference} = await setup();
  await submitToShipper(db, cfg, reference, order, answer(201, {id: 555}));
  const ev = (status: string, at: string) => ({orderId: '555', status, at: new Date(at)});
  assert.equal((await applyShipperEvent(db, ev('shipment:onitsway', '2026-11-02T10:00:00Z'))).rows.length, 1);
  assert.equal((await applyShipperEvent(db, ev('shipment:delivered', '2026-11-03T10:00:00Z'))).rows.length, 1);
  assert.equal((await applyShipperEvent(db, ev('shipment:onitsway', '2026-11-02T11:00:00Z'))).rows.length, 0);
  assert.equal((await row(db, reference)).shipper_status, 'shipment:delivered');
  assert.equal((await applyShipperEvent(db, {orderId: '999', status: 'x', at: new Date()})).rows.length, 0);
});

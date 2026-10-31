import assert from 'node:assert/strict';
import {test} from 'node:test';
import {PGlite} from '@electric-sql/pglite';
import {checkCodOrder, codAlert, tnd, tunisianPhone, type PricedProduct} from '../../apps/tunisia/lib/orders/cod';
import {codConfig} from '../../apps/tunisia/lib/orders/config';
import {markAlerted, ordersSchema, saveOrder, type Queryable} from '../../apps/tunisia/lib/orders/store';

const products: PricedProduct[] = [
  {id: 'p1', title: {en: 'Air fryer', fr: 'Friteuse', ar: 'قلاية'}, priceMillimes: 249000, stock: 5, active: true},
  {id: 'p2', title: {en: 'Mug', fr: 'Tasse', ar: 'كوب'}, priceMillimes: 12500, stock: 1, active: true},
  {id: 'p3', title: {en: 'Gone', fr: 'Parti', ar: 'ذهب'}, priceMillimes: 1000, stock: 9, active: false},
];
const good = {requestKey: 'a'.repeat(20), locale: 'fr', name: ' Amine  Ben Salah ', phone: '+216 98 123 456', governorate: 'Tunis', delegation: 'La Marsa', address: '12 Rue de la Paix', notes: '', lines: [{id: 'p1', quantity: 2}, {id: 'p2', quantity: 1}, {id: 'p1', quantity: 1}]};

test('Tunisian phone numbers are normalised and others refused', () => {
  for (const ok of ['98123456', '+216 98 123 456', '00216 98123456', '(216) 98-123-456']) assert.equal(tunisianPhone(ok), '+21698123456', ok);
  for (const no of ['', '1234567', '098123456', '+33612345678', 'abc', 12345678]) assert.equal(tunisianPhone(no), null, String(no));
});
test('the server prices the order from its own catalogue and merges duplicate lines', () => {
  const r = checkCodOrder({...good, lines: [...good.lines, {id: 'p1', quantity: 1, priceMillimes: 1} as never]}, products);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.order.name, 'Amine Ben Salah');
  assert.equal(r.order.phone, '+21698123456');
  assert.deepEqual(r.order.items.map(i => [i.id, i.quantity]), [['p1', 4], ['p2', 1]]);
  assert.equal(r.order.subtotalMillimes, 4 * 249000 + 12500);
  assert.equal(tnd(r.order.subtotalMillimes), '1008.500 TND');
});
test('bad details, bad carts and out-of-stock quantities are refused with a code', () => {
  const cases: [Record<string, unknown>, string, string?][] = [
    [{name: 'A'}, 'INVALID_DETAILS', 'name'], [{phone: '123'}, 'INVALID_DETAILS', 'phone'], [{governorate: 'Paris'}, 'INVALID_DETAILS', 'governorate'],
    [{delegation: ''}, 'INVALID_DETAILS', 'delegation'], [{address: 'x'}, 'INVALID_DETAILS', 'address'], [{requestKey: 'short'}, 'INVALID_DETAILS', 'requestKey'],
    [{lines: []}, 'INVALID_CART'], [{lines: 'x'}, 'INVALID_CART'], [{lines: [{id: 'p1', quantity: 0}]}, 'INVALID_CART'], [{lines: [{id: 'p1', quantity: 11}]}, 'INVALID_CART'],
    [{lines: [{id: 'nope', quantity: 1}]}, 'INVALID_CART'], [{lines: [{id: 'p3', quantity: 1}]}, 'INVALID_CART'], [{lines: [{id: 'p2', quantity: 2}]}, 'OUT_OF_STOCK'],
  ];
  for (const [patch, code, field] of cases) {
    const r = checkCodOrder({...good, ...patch}, products);
    assert.ok(!r.ok, JSON.stringify(patch));
    if (!r.ok) { assert.equal(r.code, code, JSON.stringify(patch)); if (field) assert.equal(r.field, field); }
  }
  assert.ok(!checkCodOrder(null, products).ok);
});
test('the staff email escapes customer text and says nothing is paid and the fee is unconfirmed', () => {
  const r = checkCodOrder({...good, name: '<b>Evil</b>', notes: '"><script>x</script>'}, products);
  assert.ok(r.ok);
  if (!r.ok) return;
  const {subject, html} = codAlert('TN-ABCD1234', r.order);
  assert.match(subject, /^New COD order TN-ABCD1234: /);
  assert.ok(!html.includes('<script>') && !html.includes('<b>Evil'));
  assert.match(html, /&lt;b&gt;Evil/);
  assert.match(html, /Nothing has been paid/);
  assert.match(html, /to be confirmed on the call/);
});
test('ordering stays closed unless every piece is configured', () => {
  const env = {TUNISIA_ORDERS_ENABLED: 'true', TUNISIA_DATABASE_URL: 'postgres://x', RESEND_API_KEY: 're_x', TUNISIA_FROM_EMAIL: 'Plentovo <orders@plentovo.com>', TUNISIA_ORDER_ALERT_EMAIL: 'Ops@plentovo.com, bad, ops@plentovo.com'};
  assert.deepEqual(codConfig(env)?.to, ['ops@plentovo.com']);
  assert.equal(codConfig({...env, DATABASE_URL: 'postgres://y', TUNISIA_DATABASE_URL: ''})?.databaseUrl, 'postgres://y');
  for (const drop of ['TUNISIA_ORDERS_ENABLED', 'TUNISIA_DATABASE_URL', 'RESEND_API_KEY', 'TUNISIA_FROM_EMAIL', 'TUNISIA_ORDER_ALERT_EMAIL']) assert.equal(codConfig({...env, [drop]: ''}), null, drop);
  assert.equal(codConfig({...env, TUNISIA_ORDERS_ENABLED: 'yes'}), null);
  assert.equal(codConfig({}), null);
});

async function db() { const pg = new PGlite(); await pg.exec(ordersSchema); return pg as unknown as Queryable & {query: PGlite['query']}; }
const order = (over: Record<string, unknown> = {}) => { const r = checkCodOrder({...good, ...over}, products); assert.ok(r.ok); return (r as {ok: true; order: Parameters<typeof saveOrder>[1]}).order; };

test('an order is saved once per request key and the alert flag survives a retry', async () => {
  const d = await db();
  const first = await saveOrder(d, order());
  assert.equal(first.status, 'created');
  assert.ok(/^TN-[0-9A-F]{8}$/.test(first.reference) && !first.alerted);
  const again = await saveOrder(d, order());
  assert.ok(again.status === 'existing' && again.reference === (first as {reference: string}).reference && !again.alerted);
  await markAlerted(d, (first as {reference: string}).reference);
  const third = await saveOrder(d, order());
  assert.ok(third.status === 'existing' && third.alerted);
  assert.equal(Number(((await d.query('SELECT count(*)::int AS n FROM public.plentovo_tn_orders')).rows[0] as {n: number}).n), 1);
  const row = (await d.query('SELECT status,subtotal_millimes,customer FROM public.plentovo_tn_orders')).rows[0] as {status: string; subtotal_millimes: number; customer: {phone: string}};
  assert.equal(row.status, 'PENDING_CONFIRMATION');
  assert.equal(row.subtotal_millimes, 3 * 249000 + 12500);
  assert.equal(row.customer.phone, '+21698123456');
});
test('one phone number cannot flood orders', async () => {
  const d = await db();
  const status = async (o: Parameters<typeof saveOrder>[1]) => (await saveOrder(d, o)).status as string;
  for (let i = 0; i < 3; i++) assert.equal(await status(order({requestKey: `key-${i}-`.padEnd(20, 'x')})), 'created');
  assert.equal(await status(order({requestKey: 'key-9-'.padEnd(20, 'x')})), 'rate_limited');
  assert.equal(await status(order({requestKey: 'key-8-'.padEnd(20, 'x'), phone: '97 111 222'})), 'created');
});

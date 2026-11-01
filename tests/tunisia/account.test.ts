import assert from 'node:assert/strict';
import {test} from 'node:test';
import {PGlite} from '@electric-sql/pglite';
import {checkCodOrder, type PricedProduct} from '../../apps/tunisia/lib/orders/cod';
import {ordersSchema, saveOrder, type Queryable} from '../../apps/tunisia/lib/orders/store';
import {accountSchema, checkCode, createSession, customerFromToken, deleteCustomer, endSession, issueCode, listOrders, normaliseEmail, orderStage, readCookie, saveProfile, signInCustomer} from '../../apps/tunisia/lib/account/auth';

const SECRET = 'test-secret-test-secret-test-secret';
const products: PricedProduct[] = [{id: 'p1', title: {en: 'Air fryer', fr: 'Friteuse', ar: 'قلاية'}, priceMillimes: 249000, stock: 5, active: true}];
const base = {locale: 'fr', name: 'Amine', phone: '98123456', governorate: 'Tunis', delegation: 'La Marsa', address: '12 Rue de la Paix', lines: [{id: 'p1', quantity: 1}]};
async function setup() {
  const pg = new PGlite(); const db: Queryable = {query: (sql, params) => pg.query(sql, params as never[]) as never};
  await pg.exec(ordersSchema); await pg.exec(accountSchema);
  const order = async (key: string, email: string, phone = '98123456') => { const r = checkCodOrder({...base, requestKey: key.repeat(20).slice(0, 20), email, phone}, products); assert.ok(r.ok); if (!r.ok) throw new Error(); const s = await saveOrder(db, r.order); assert.equal(s.status, 'created'); return s.status === 'created' ? s.reference : ''; };
  return {pg, db, order};
}
const t0 = new Date('2026-11-02T10:00:00Z'), plus = (ms: number) => new Date(t0.getTime() + ms);

test('emails are normalised and junk refused', () => {
  assert.equal(normaliseEmail('  Amine@Example.COM '), 'amine@example.com');
  for (const bad of ['', 'x', 'a@b', 'a b@c.com', 5, null]) assert.equal(normaliseEmail(bad), null);
});
test('a code works once, expires, is limited to 5 tries, and can only be re-sent after a minute', async () => {
  const {db} = await setup();
  const a = await issueCode(db, 'a@x.com', SECRET, t0); assert.equal(a.status, 'sent'); if (a.status !== 'sent') return;
  assert.deepEqual(await issueCode(db, 'a@x.com', SECRET, plus(20_000)), {status: 'wait', seconds: 40});
  assert.equal(await checkCode(db, 'a@x.com', a.code, SECRET, plus(30_000)), true);
  assert.equal(await checkCode(db, 'a@x.com', a.code, SECRET, plus(31_000)), false); // single use
  const b = await issueCode(db, 'a@x.com', SECRET, plus(61_000)); if (b.status !== 'sent') return;
  assert.equal(await checkCode(db, 'a@x.com', b.code, SECRET, plus(61_000 + 11 * 60_000)), false); // expired
  const c = await issueCode(db, 'a@x.com', SECRET, plus(20 * 60_000)); if (c.status !== 'sent') return;
  const wrong = c.code === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i++) assert.equal(await checkCode(db, 'a@x.com', wrong, SECRET, plus(20 * 60_000 + 1000)), false);
  assert.equal(await checkCode(db, 'a@x.com', c.code, SECRET, plus(20 * 60_000 + 2000)), false); // locked even with the right code
});
test('a code for one email never works for another, or with another secret', async () => {
  const {db} = await setup();
  const a = await issueCode(db, 'a@x.com', SECRET, t0); const b = await issueCode(db, 'b@x.com', SECRET, t0);
  if (a.status !== 'sent' || b.status !== 'sent') return;
  assert.equal(await checkCode(db, 'b@x.com', a.code === b.code ? '123456' : a.code, SECRET, plus(1000)), false);
  assert.equal(await checkCode(db, 'a@x.com', a.code, 'a-different-secret-a-different-secret', plus(1000)), false);
});
test('signing in creates the account once and claims only that email\'s guest orders', async () => {
  const {db, order} = await setup();
  const mine = await order('a', 'amine@example.com'), theirs = await order('b', 'other@example.com', '98765432'), noEmail = await order('c', '', '97111222');
  const c1 = await signInCustomer(db, 'amine@example.com', 'ar', t0), c2 = await signInCustomer(db, 'amine@example.com', 'fr', plus(1000));
  assert.equal(c1.id, c2.id); assert.equal(c1.locale, 'ar');
  assert.deepEqual((await listOrders(db, c1.id)).map(o => o.reference), [mine]);
  const other = await signInCustomer(db, 'other@example.com', 'fr', t0);
  assert.deepEqual((await listOrders(db, other.id)).map(o => o.reference), [theirs]);
  assert.ok(![mine, theirs].includes(noEmail));
});
test('sessions look up, expire and end; cookies parse', async () => {
  const {db} = await setup(); const c = await signInCustomer(db, 'a@x.com', 'fr', t0);
  const {token} = await createSession(db, c.id, t0);
  assert.equal((await customerFromToken(db, token, plus(86_400_000)))?.id, c.id);
  assert.equal(await customerFromToken(db, token, plus(31 * 86_400_000)), null);
  assert.equal(await customerFromToken(db, 'x'.repeat(43), t0), null);
  assert.equal(await customerFromToken(db, undefined, t0), null);
  await endSession(db, token); assert.equal(await customerFromToken(db, token, plus(1000)), null);
  assert.equal(readCookie('a=1; plentovo_tn_session=abc; b=2'), 'abc'); assert.equal(readCookie(null), undefined);
});
test('saved details are returned with the customer', async () => {
  const {db} = await setup(); const c = await signInCustomer(db, 'a@x.com', 'fr', t0);
  await saveProfile(db, c.id, {name: 'Amine', phone: '+21698123456', governorate: 'Tunis', delegation: 'La Marsa', address: '12 Rue'});
  const {token} = await createSession(db, c.id, t0);
  assert.deepEqual(await customerFromToken(db, token, plus(1000)), {...c, name: 'Amine', phone: '+21698123456', governorate: 'Tunis', delegation: 'La Marsa', address: '12 Rue'});
});
test('deleting the account removes it and its sessions, and unlinks orders and removes the email from them', async () => {
  const {db, pg, order} = await setup(); const ref = await order('a', 'amine@example.com');
  const c = await signInCustomer(db, 'amine@example.com', 'fr', t0); const {token} = await createSession(db, c.id, t0);
  await deleteCustomer(db, c.id, c.email);
  assert.equal(await customerFromToken(db, token, plus(1000)), null);
  assert.equal((await pg.query('SELECT count(*)::int n FROM public.plentovo_tn_customers')).rows[0].n, 0);
  const row = (await pg.query('SELECT customer_id, customer FROM public.plentovo_tn_orders WHERE reference=$1', [ref])).rows[0] as any;
  assert.equal(row.customer_id, null); assert.equal(row.customer.email, undefined); assert.equal(row.customer.name, 'Amine');
});
test('customers see one simple stage per order', () => {
  assert.equal(orderStage('PENDING_CONFIRMATION', null), 'received');
  assert.equal(orderStage('PENDING_CONFIRMATION', 'submitted'), 'received');
  assert.equal(orderStage('PENDING_CONFIRMATION', 'Paid'), 'confirmed');
  assert.equal(orderStage('PENDING_CONFIRMATION', 'shipment:onitsway'), 'on_the_way');
  assert.equal(orderStage('PENDING_CONFIRMATION', 'shipment:delivered'), 'delivered');
  assert.equal(orderStage('PENDING_CONFIRMATION', 'shipment:undelivered'), 'received');
  assert.equal(orderStage('PENDING_CONFIRMATION', 'canceled'), 'cancelled');
});

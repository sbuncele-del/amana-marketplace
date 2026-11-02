import assert from 'node:assert/strict';
import {test} from 'node:test';
import {PGlite} from '@electric-sql/pglite';
import {canMove, isStale, missingForMove, nextMoves, tabCounts} from '../../src/lib/orders-desk/domain';
import {deskSchema, listOrders, moveOrder, orderHistory} from '../../src/lib/orders-desk/store';

const staff = {id: 'u1', name: 'Amel', who: 'staff' as const};
const seller = {id: 'u2', name: 'Sfax Fulfilment', who: 'seller' as const, partnerIds: ['p1']};
async function setup() {
  const db = new PGlite();
  await db.exec(deskSchema);
  for (const ref of ['TN-1', 'TN-2']) {
    await db.query(
      `INSERT INTO public.plentovo_tn_orders(id,reference,request_key,locale,customer,items,subtotal_millimes) VALUES($1,$2,$3,'fr',$4,$5,50000)`,
      [ref, ref, ref + 'k', JSON.stringify({name: 'Amine', phone: '+21698123456', governorate: 'Tunis', delegation: 'La Marsa', address: '12 Rue', notes: 'after 5pm'}), JSON.stringify([{id: 'p', title: 'Mug', quantity: 2, unitMillimes: 25000}])]);
  }
  return db;
}

test('rules: who may move an order where', () => {
  assert.ok(canMove('staff', 'PENDING_CONFIRMATION', 'CONFIRMED'));
  assert.ok(!canMove('staff', 'CANCELLED', 'CONFIRMED'));
  assert.ok(!canMove('seller', 'PENDING_CONFIRMATION', 'CONFIRMED'));
  assert.deepEqual(nextMoves('seller', 'CONFIRMED'), ['DISPATCHED']);
  assert.equal(missingForMove({to: 'CONFIRMED'}, {partnerId: null}) !== null, true);
  assert.equal(missingForMove({to: 'DISPATCHED'}, {partnerId: null}) !== null, true);
  assert.equal(missingForMove({to: 'DISPATCHED'}, {partnerId: 'p1'}), null);
  assert.equal(missingForMove({to: 'CANCELLED'}, {partnerId: null}) !== null, true);
});
test('tabs count orders and a two-hour-old uncalled order is stale', () => {
  const c = tabCounts([{status: 'PENDING_CONFIRMATION'}, {status: 'PENDING_CONFIRMATION'}, {status: 'NO_ANSWER'}]);
  assert.equal(c.to_call, 2); assert.equal(c.no_answer, 1); assert.equal(c.delivered, 0);
  const now = new Date('2026-11-02T12:00:00Z');
  assert.ok(isStale('PENDING_CONFIRMATION', '2026-11-02T09:00:00Z', now));
  assert.ok(!isStale('PENDING_CONFIRMATION', '2026-11-02T11:00:00Z', now));
  assert.ok(!isStale('CONFIRMED', '2026-11-02T01:00:00Z', now));
});
test('a call is counted and logged, and a second person cannot overwrite it', async () => {
  const db = await setup();
  const a = await moveOrder(db, {reference: 'TN-1', expectedFrom: 'PENDING_CONFIRMATION', actor: staff, move: {to: 'NO_ANSWER', note: 'rang twice'}});
  assert.ok(a.ok && a.order.status === 'NO_ANSWER' && a.order.callAttempts === 1 && a.order.lastCallBy === 'Amel');
  const stale = await moveOrder(db, {reference: 'TN-1', expectedFrom: 'PENDING_CONFIRMATION', actor: {...staff, name: 'Ben'}, move: {to: 'CANCELLED', note: 'x'}});
  assert.ok(!stale.ok && stale.code === 'CHANGED');
  const h = await orderHistory(db, 'TN-1');
  assert.equal(h.length, 1); assert.equal(h[0].note, 'rang twice');
});
test('confirming needs a fee; sellers see only confirmed orders assigned to them, without call notes', async () => {
  const db = await setup();
  const bad = await moveOrder(db, {reference: 'TN-1', expectedFrom: 'PENDING_CONFIRMATION', actor: staff, move: {to: 'CONFIRMED'}});
  assert.ok(!bad.ok && bad.code === 'INCOMPLETE');
  assert.deepEqual(await listOrders(db, {who: 'seller', partnerIds: ['p1']}), []);
  const ok = await moveOrder(db, {reference: 'TN-1', expectedFrom: 'PENDING_CONFIRMATION', actor: staff, move: {to: 'CONFIRMED', deliveryFeeMillimes: 7000, partnerId: 'p1', note: 'internal remark'}});
  assert.ok(ok.ok);
  const seen = await listOrders(db, {who: 'seller', partnerIds: ['p1']});
  assert.equal(seen.length, 1); assert.equal(seen[0].reference, 'TN-1');
  assert.ok(!('callAttempts' in seen[0]) && !('lastNote' in seen[0]));
  assert.deepEqual(await listOrders(db, {who: 'seller', partnerIds: ['other']}), []);
});
test('a seller can dispatch and deliver their own order but not another seller\'s or a cancelled one', async () => {
  const db = await setup();
  await moveOrder(db, {reference: 'TN-1', expectedFrom: 'PENDING_CONFIRMATION', actor: staff, move: {to: 'CONFIRMED', deliveryFeeMillimes: 7000, partnerId: 'p1'}});
  const other = await moveOrder(db, {reference: 'TN-1', expectedFrom: 'CONFIRMED', actor: {...seller, partnerIds: ['p9']}, move: {to: 'DISPATCHED'}});
  assert.ok(!other.ok && other.code === 'NOT_FOUND');
  const d = await moveOrder(db, {reference: 'TN-1', expectedFrom: 'CONFIRMED', actor: seller, move: {to: 'DISPATCHED', trackingNumber: ' TRK123 '}});
  assert.ok(d.ok && d.order.trackingNumber === 'TRK123');
  const cancel = await moveOrder(db, {reference: 'TN-1', expectedFrom: 'DISPATCHED', actor: seller, move: {to: 'CANCELLED', note: 'x'}});
  assert.ok(!cancel.ok && cancel.code === 'NOT_ALLOWED');
  const done = await moveOrder(db, {reference: 'TN-1', expectedFrom: 'DISPATCHED', actor: seller, move: {to: 'DELIVERED'}});
  assert.ok(done.ok && done.order.status === 'DELIVERED');
});

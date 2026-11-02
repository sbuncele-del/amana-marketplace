import assert from 'node:assert/strict';
import {test} from 'node:test';
import {cartEstimateCents, cheapestBobGo, perfectDealzFeeCents, quoteDelivery, rateCardAgeDays} from '../../src/lib/delivery/quote';

test('Perfect Dealz bands match their published table', () => {
  assert.equal(perfectDealzFeeCents(9990), 7900);
  assert.equal(perfectDealzFeeCents(10000), 12000);
  assert.equal(perfectDealzFeeCents(39000), 19900);
  assert.equal(perfectDealzFeeCents(250000), 69900);
});
test('Bob Go cheapest price per zone comes from the rate card, rounding the weight up', () => {
  assert.deepEqual(cheapestBobGo(5000, 'local'), {cents: 7038, courier: 'Fastway', service: 'LOC'});
  assert.equal(cheapestBobGo(5000, 'main')?.cents, 9798);
  assert.equal(cheapestBobGo(9200, 'main')?.cents, cheapestBobGo(10000, 'main')?.cents);
  assert.equal(cheapestBobGo(2_000_000, 'local'), null);
});
test('Perfect Dealz parcels always use their own rate', () => {
  const q = quoteDelivery({grams: 3000, zone: 'local', fulfilledBy: 'PERFECT_DEALZ'});
  assert.deepEqual(q, {feeCents: 7900, setBy: 'perfect-dealz', courier: null, service: null, costCents: null, marginCents: null});
  assert.equal(quoteDelivery({grams: 3000, zone: null, fulfilledBy: 'PERFECT_DEALZ'})?.feeCents, 7900);
});
test('our own parcels: the customer pays the full Bob Go price, with no cap', () => {
  const low = quoteDelivery({grams: 5000, zone: 'local', fulfilledBy: 'PLENTOVO'})!;
  assert.equal(low.feeCents, 7038); assert.equal(low.setBy, 'bob-go'); assert.equal(low.marginCents, 0);
  const main = quoteDelivery({grams: 5000, zone: 'main', fulfilledBy: 'PLENTOVO'})!;
  assert.equal(main.feeCents, 9798); assert.equal(main.costCents, 9798); assert.equal(main.marginCents, 0);
  const heavy = quoteDelivery({grams: 40000, zone: 'main', fulfilledBy: 'PLENTOVO'})!;
  assert.equal(heavy.feeCents, 33259); assert.equal(heavy.courier, 'SkyNet');
});
test('refuses to guess when it cannot price a parcel we ship ourselves', () => {
  assert.equal(quoteDelivery({grams: 5000, zone: null, fulfilledBy: 'PLENTOVO'}), null);
  assert.equal(quoteDelivery({grams: 0, zone: 'local', fulfilledBy: 'PLENTOVO'}), null);
  assert.equal(quoteDelivery({grams: NaN, zone: 'local', fulfilledBy: 'PERFECT_DEALZ'}), null);
  assert.equal(quoteDelivery({grams: 1_500_000, zone: 'local', fulfilledBy: 'PLENTOVO'}), null);
});
test('the cart estimate is never above Perfect Dealz and uses the cheapest zone', () => {
  assert.equal(cartEstimateCents(5000), 7038);
  assert.equal(cartEstimateCents(100), 7038);
  assert.ok(cartEstimateCents(60000)! <= 39900);
});
test('rate card age is measured from its export date', () => {
  assert.equal(rateCardAgeDays(new Date('2026-11-12T00:00:00Z')), 10);
});

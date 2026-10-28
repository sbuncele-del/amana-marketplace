import {test} from 'node:test';
import assert from 'node:assert/strict';
import {choosePrice, parseMoney} from '../lib/import/pricing';
import {loadConfig} from '../lib/import/config';
const off = loadConfig({}), on = loadConfig({TUNISIA_PROVISIONAL_PRICING: 'markup', TUNISIA_PROVISIONAL_MARKUP_PCT: '40', TUNISIA_PROVISIONAL_ROUNDING_MILLIMES: '500', TUNISIA_PROVISIONAL_MIN_MARGIN_MILLIMES: '1000'});
test('parseMoney separates missing, invalid and padded decimal values', () => {
 assert.deepEqual(parseMoney(null), {kind: 'missing'});
 assert.deepEqual(parseMoney(''), {kind: 'missing'});
 assert.deepEqual(parseMoney('25.000000000000000000000000000000'), {kind: 'ok', millimes: 25000});
 assert.deepEqual(parseMoney('12.345'), {kind: 'ok', millimes: 12345});
 assert.deepEqual(parseMoney('abc'), {kind: 'invalid'});
 assert.deepEqual(parseMoney('-5'), {kind: 'invalid'});
});
test('the account price wins and is tagged account', () => {
 assert.deepEqual(choosePrice({accountPrice: 25000, recommendedPrice: 30000, cost: 12000}, on), {price: 25000, basis: 'account', belowCost: false});
});
test('a supplier recommendation is used only when there is no account price, and is tagged separately', () => {
 assert.deepEqual(choosePrice({accountPrice: null, recommendedPrice: 30000, cost: 12000}, on), {price: 30000, basis: 'supplier_recommended', belowCost: false});
});
test('provisional pricing is off by default: no price means no price, never the cost', () => {
 assert.deepEqual(choosePrice({accountPrice: null, recommendedPrice: null, cost: 12000}, off), {price: null, basis: null, belowCost: false});
});
test('provisional price is cost plus markup, rounded up, tagged provisional and strictly above cost', () => {
 const r = choosePrice({accountPrice: null, recommendedPrice: null, cost: 12000}, on); // 12000*1.4 = 16800 -> 17000
 assert.deepEqual(r, {price: 17000, basis: 'provisional', belowCost: false});
 assert.ok(r.price! > 12000);
});
test('the minimum margin applies to very cheap items', () => {
 const r = choosePrice({accountPrice: null, recommendedPrice: null, cost: 500}, on); // 500*1.4=700 < 500+1000 -> 1500
 assert.equal(r.price, 1500);
});
test('zero or negative prices are never used and zero cost cannot drive a provisional price', () => {
 assert.equal(choosePrice({accountPrice: 0, recommendedPrice: null, cost: 0}, on).price, null);
 assert.equal(choosePrice({accountPrice: null, recommendedPrice: null, cost: null}, on).price, null);
});
test('an account price at or below cost is flagged', () => {
 assert.equal(choosePrice({accountPrice: 12000, recommendedPrice: null, cost: 12000}, off).belowCost, true);
 assert.equal(choosePrice({accountPrice: 9000, recommendedPrice: null, cost: 12000}, off).belowCost, true);
});
test('enabling provisional pricing without a markup is a configuration error', () => {
 assert.throws(() => loadConfig({TUNISIA_PROVISIONAL_PRICING: 'markup'}), /MARKUP_PCT/);
 assert.throws(() => loadConfig({TUNISIA_PROVISIONAL_PRICING: 'banana'}), /off or markup/);
 assert.throws(() => loadConfig({TUNISIA_PROVISIONAL_PRICING: 'markup', TUNISIA_PROVISIONAL_MARKUP_PCT: '-5'}), /between/);
});

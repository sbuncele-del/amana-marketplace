import assert from 'node:assert/strict';
import {test} from 'node:test';
import {recommend} from '../../apps/tunisia/lib/recommendations';
import type {ProductGroup} from '../../apps/tunisia/lib/product-groups';

const g = (id: string, en: string, price: number, stock = 3, image = 'x.jpg'): ProductGroup => ({id, slug: id, title: {en, fr: en, ar: en}, image, category: 'general', variants: [], priceMillimes: price, stock});
const viewed = g('a', 'Car phone holder magnetic', 15000);
const all = [viewed, g('b', 'Car phone holder dashboard', 18000), g('c', 'Air fryer 5L', 249000), g('d', 'Phone stand desk', 16000), g('e', 'Car holder gone', 15000, 0), g('f', 'No image holder car', 15000, 2, '')];

test('never recommends the viewed product, sold-out items or items without an image', () => {
  const ids = recommend(viewed, all).map(x => x.id);
  assert.ok(!ids.includes('a') && !ids.includes('e') && !ids.includes('f'));
});
test('similar names and prices rank first, and the order is stable', () => {
  const ids = recommend(viewed, all).map(x => x.id);
  assert.equal(ids[0], 'b');
  assert.ok(ids.indexOf('d') < ids.indexOf('c'));
  assert.deepEqual(recommend(viewed, all).map(x => x.id), ids);
});
test('respects the limit', () => assert.equal(recommend(viewed, all, 1).length, 1));

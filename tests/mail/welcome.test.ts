import {test} from 'node:test';
import assert from 'node:assert/strict';
import {welcomeEmail} from '../../src/lib/mail/templates';
const product = {name: '<Beautiful & useful>', slug: 'test-product', image: '/brand/plentovo-hero.webp', price: 199, currency: 'ZAR'};
test('ZA welcome includes local product cards, safe names and unsubscribe', () => {
 const {html} = welcomeEmail('test-token', [product], 'ZA');
 assert.match(html, /Good finds to get you started/);
 assert.match(html, /&lt;Beautiful &amp; useful&gt;/);
 assert.match(html, /product\/test-product/);
 assert.match(html, /199/);
 assert.match(html, /newsletter\/unsubscribe\?token=test-token/);
 assert.doesNotMatch(html, /bestseller|WELCOME10|primesources/i);
});
test('unknown and unsupported markets never receive ZA product cards', () => {
 for (const market of [null, 'TN', 'DZ']) {
  const {html} = welcomeEmail('test-token', [product], market);
  assert.doesNotMatch(html, /product\/test-product/);
  assert.match(html, /Choose your shopping country/);
 }
});
test('invalid prices, currencies and image protocols are excluded', () => {
 for (const bad of [{...product,price:NaN}, {...product,price:-1}, {...product,currency:'TND'}, {...product,image:'javascript:alert(1)'}]) {
  assert.doesNotMatch(welcomeEmail('token',[bad],'ZA').html, /product\/test-product/);
 }
});

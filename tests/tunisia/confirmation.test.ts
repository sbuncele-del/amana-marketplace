import assert from 'node:assert/strict';
import {test} from 'node:test';
import {checkCodOrder, codConfirmation, type PricedProduct} from '../../apps/tunisia/lib/orders/cod';

const products: PricedProduct[] = [{id: 'p1', title: {en: 'Air fryer', fr: 'Friteuse <b>', ar: 'قلاية'}, priceMillimes: 249000, stock: 5, active: true}];
const base = {requestKey: 'a'.repeat(20), locale: 'fr', name: 'Amine <script>', phone: '98123456', governorate: 'Tunis', delegation: 'La Marsa', address: '12 Rue de la Paix', notes: '', lines: [{id: 'p1', quantity: 2}]};
const order = (extra: Record<string, unknown> = {}) => { const r = checkCodOrder({...base, ...extra}, products); assert.ok(r.ok); return r.ok ? r.order : (undefined as never); };

test('email is optional, trimmed and lower-cased; a bad one is refused', () => {
  assert.equal(order().email, '');
  assert.equal(order({email: '  Amine@Example.COM '}).email, 'amine@example.com');
  const bad = checkCodOrder({...base, email: 'not-an-email'}, products);
  assert.deepEqual(bad.ok ? null : [bad.code, bad.field], ['INVALID_DETAILS', 'email']);
});
test('the customer email is in their language and says received, not confirmed', () => {
  const fr = codConfirmation('TN-1', order({locale: 'fr'})), en = codConfirmation('TN-1', order({locale: 'en'})), ar = codConfirmation('TN-1', order({locale: 'ar'}));
  assert.match(fr.subject, /bien reçu/); assert.match(en.subject, /received/); assert.match(ar.subject, /استلمنا/);
  assert.match(en.html, /Nothing is sent until you confirm/);
  assert.match(en.html, /498\.000 TND/);
  assert.match(en.html, /TN-1/);
});
test('Arabic is right-to-left and customer text is escaped', () => {
  const ar = codConfirmation('TN-1', order({locale: 'ar'}));
  assert.match(ar.html, /dir="rtl"/);
  const fr = codConfirmation('TN-1', order({locale: 'fr'}));
  assert.ok(!fr.html.includes('<script>') && !fr.html.includes('<b>'));
  assert.match(fr.html, /Amine &lt;script&gt;/);
});

import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import {PGlite} from '@electric-sql/pglite';
import {encode, notificationSignatureValid, parseBody, sign, signedCheckout, type Pairs} from '../../src/lib/payfast/signature';
import {payfastConfig} from '../../src/lib/payfast/config';
import {claimedReference, verifyItn, type ItnDeps} from '../../src/lib/payfast/itn';
import {buildCheckoutOrder, payfastFields, type CheckoutDeps} from '../../src/lib/orders/checkout';
import {findAwaiting, recordPayment, type Tx} from '../../src/lib/orders/payment';
import {notifyPaidOrder, type Deps, type Queryable} from '../../src/lib/orders/notify';

const env = {PAYFAST_ENABLED: 'true', PAYFAST_MERCHANT_ID: '10000100', PAYFAST_MERCHANT_KEY: '46f0cd694581a', PAYFAST_PASSPHRASE: 'my pass', PAYFAST_MODE: 'sandbox'};
const cfg = payfastConfig(env)!;
const md5 = (s: string) => createHash('md5').update(s).digest('hex');

test('encoding matches PHP urlencode and signatures use field order, passphrase and lowercase md5', () => {
  assert.equal(encode("a b&c=d/(e)*'!~"), 'a+b%26c%3Dd%2F%28e%29%2A%27%21%7E');
  const pairs: Pairs = [['merchant_id', '10000100'], ['name_first', 'Thandi Nkosi'], ['amount', '100.00']];
  assert.equal(sign(pairs, 'my pass', {skipEmpty: true}), md5('merchant_id=10000100&name_first=Thandi+Nkosi&amount=100.00&passphrase=my+pass'));
  assert.equal(sign(pairs, '', {skipEmpty: true}), md5('merchant_id=10000100&name_first=Thandi+Nkosi&amount=100.00'));
  assert.notEqual(sign([...pairs].reverse(), 'my pass', {skipEmpty: true}), sign(pairs, 'my pass', {skipEmpty: true}));
});
test('checkout signing drops empty fields and signs last', () => {
  const out = signedCheckout([['a', '1'], ['cell_number', ''], ['b', ' two ']], 'p');
  assert.deepEqual(out.map(([k]) => k), ['a', 'b', 'signature']);
  assert.equal(out[2][1], md5('a=1&b=two&passphrase=p'));
});
test('config is off unless enabled and complete; live needs a passphrase', () => {
  assert.equal(payfastConfig({}), null);
  assert.equal(payfastConfig({...env, PAYFAST_ENABLED: 'yes'}), null);
  assert.equal(payfastConfig({...env, PAYFAST_MERCHANT_KEY: ''}), null);
  assert.equal(payfastConfig({...env, PAYFAST_MODE: 'live', PAYFAST_PASSPHRASE: ''}), null);
  assert.equal(payfastConfig({...env, PAYFAST_SITE_URL: 'http://x'}), null);
  const live = payfastConfig({...env, PAYFAST_MODE: 'live'})!;
  assert.equal(live.processUrl, 'https://www.payfast.co.za/eng/process');
  assert.equal(cfg.processUrl, 'https://sandbox.payfast.co.za/eng/process');
  assert.ok(live.hosts.includes('w1w.payfast.co.za'));
});

// --- notification verification ---
function itnBody(over: Record<string, string> = {}, passphrase = cfg.passphrase) {
  const pairs: Pairs = Object.entries({m_payment_id: 'AM-O-ABC', pf_payment_id: '1089250', payment_status: 'COMPLETE', item_name: 'Plentovo order', item_description: '', amount_gross: '1599.00', amount_fee: '-58.78', amount_net: '1540.22', merchant_id: cfg.merchantId, ...over});
  return [...pairs, ['signature', sign(pairs, passphrase, {skipEmpty: false})] as [string, string]].map(([k, v]) => `${k}=${encode(v)}`).join('&');
}
const deps = (answer = 'VALID', ips = ['41.74.179.194']): ItnDeps & {posted: string[]} => {
  const posted: string[] = [];
  return {posted, resolveIps: async () => ips, postValidate: async (_u, b) => { posted.push(b); return answer; }};
};
const expected = {reference: 'AM-O-ABC', totalCents: 159900};
const ip = '41.74.179.194';

test('a genuine notification is accepted and returns payment details', async () => {
  const d = deps();
  const r = await verifyItn({rawBody: itnBody(), sourceIp: ip, expected}, cfg, d);
  assert.deepEqual(r, {ok: true, paymentRef: '1089250', grossCents: 159900, feeCents: 5878, netCents: 154022});
  assert.ok(!d.posted[0].includes('signature=') && !d.posted[0].includes('passphrase'));
  assert.equal(claimedReference(itnBody()), 'AM-O-ABC');
});
test('each security check rejects on its own', async () => {
  const cases: [string, Parameters<typeof verifyItn>[0], ItnDeps][] = [
    ['tampered amount', {rawBody: itnBody().replace('1599.00', '1.00'), sourceIp: ip, expected}, deps()],
    ['wrong passphrase', {rawBody: itnBody({}, 'other'), sourceIp: ip, expected}, deps()],
    ['no signature', {rawBody: itnBody().replace(/&signature=.*/, ''), sourceIp: ip, expected}, deps()],
    ['signed but wrong amount for the order', {rawBody: itnBody({amount_gross: '10.00'}), sourceIp: ip, expected}, deps()],
    ['another order reference', {rawBody: itnBody({m_payment_id: 'AM-O-OTHER'}), sourceIp: ip, expected}, deps()],
    ['another merchant', {rawBody: itnBody({merchant_id: '999'}), sourceIp: ip, expected}, deps()],
    ['not from payfast', {rawBody: itnBody(), sourceIp: '1.2.3.4', expected}, deps()],
    ['no source ip', {rawBody: itnBody(), sourceIp: null, expected}, deps()],
    ['payfast says invalid', {rawBody: itnBody(), sourceIp: ip, expected}, deps('INVALID')],
    ['malformed amount', {rawBody: itnBody({amount_gross: '1599'}), sourceIp: ip, expected}, deps()],
  ];
  for (const [name, input, d] of cases) { const r = await verifyItn(input, cfg, d); assert.ok(!r.ok && r.kind === 'invalid', name); }
});
test('non-complete payments are not errors; an unreachable Payfast is retryable', async () => {
  const pending = await verifyItn({rawBody: itnBody({payment_status: 'CANCELLED'}), sourceIp: ip, expected}, cfg, deps());
  assert.ok(!pending.ok && pending.kind === 'not_complete');
  const down = await verifyItn({rawBody: itnBody(), sourceIp: ip, expected}, cfg, {resolveIps: async () => [ip], postValidate: async () => { throw new Error('timeout'); }});
  assert.ok(!down.ok && down.kind === 'unavailable');
  assert.ok(notificationSignatureValid(parseBody(itnBody()), cfg.passphrase));
});

// --- building the order from a cart on the server ---
const catalogue: CheckoutDeps = {
  product: async slug => slug === 'air-fryer' ? {slug, name: 'Air fryer', variants: [{id: '1', title: 'Black', price: 1299, supplierAvailable: true, weightGrams: 5000}, {id: '2', title: 'White', price: 1299, supplierAvailable: false, weightGrams: 5000}, {id: '3', title: 'Heavy', price: 100, supplierAvailable: true}, {id: '4', title: 'Few', price: 100, supplierAvailable: true, weightGrams: 100, managedStock: 2}]} : null,
  supplierPrice: async (_s, v) => (v.id === '1' ? 949 : null),
};
const addr = {fullName: 'Thandi Nkosi', phone: '082 123 4567', street: '12 Protea Road', city: 'Centurion', state: 'Gauteng', zip: '0157'};
const order = (over: Partial<Parameters<typeof buildCheckoutOrder>[0]> = {}) => buildCheckoutOrder({lines: [{id: 'air-fryer:1', quantity: 1}], method: 'DELIVERY', address: addr, userId: 'u1', email: 't@example.com', checkoutKey: 'k'.repeat(20), ...over}, catalogue);

test('the server prices the order itself: cart prices from the browser are ignored', async () => {
  const r = await order({lines: [{id: 'air-fryer:1', quantity: 2, unitPriceCents: 1, price: 1} as never]});
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.totalCents, 2 * 129900 + 12000); // 10 kg lands in the R120 band, not R79
  assert.equal(r.data.shippingCents, 12000);
  assert.equal((r.data.items as any[])[0].supplierCostCents, 94900);
  assert.deepEqual(r.data.deliveryAddress, ['12 Protea Road', 'Centurion, Gauteng', '0157']);
  assert.equal(r.data.paymentVerified, false);
  assert.equal(r.data.awaitingPayment, true);
});
test('collection is free; unusable carts and addresses are refused with a reason', async () => {
  const c = await order({method: 'COLLECTION'});
  assert.ok(c.ok && c.data.shippingCents === 0 && (c.data.deliveryAddress as unknown[]).length === 0);
  const bad: [Partial<Parameters<typeof buildCheckoutOrder>[0]>, RegExp][] = [
    [{lines: []}, /empty or invalid/], [{lines: [{id: 'air-fryer:1', quantity: 11}]}, /empty or invalid/], [{lines: 'x'}, /empty or invalid/],
    [{lines: [{id: 'air-fryer:2', quantity: 1}]}, /no longer available/], [{lines: [{id: 'nope:1', quantity: 1}]}, /no longer available/],
    [{lines: [{id: 'air-fryer:3', quantity: 1}]}, /delivery/], [{lines: [{id: 'air-fryer:4', quantity: 3}]}, /Only 2/],
    [{address: null}, /Choose a delivery address/], [{address: {...addr, zip: ''}}, /incomplete/],
  ];
  for (const [patch, re] of bad) { const r = await order(patch); assert.ok(!r.ok, JSON.stringify(patch)); if (!r.ok) assert.match(r.error, re); }
});
test('payfast form fields are ordered, normalised and carry the order reference', () => {
  const f = payfastFields({reference: 'AM-O-ABC', totalCents: 159900, name: 'Thandi van der Nkosi', email: 't@example.com', phone: '+27 82 123 4567', itemNames: ['1 x Air fryer']}, cfg);
  const get = (k: string) => f.find(([key]) => key === k)![1];
  assert.deepEqual(f.map(([k]) => k).slice(0, 5), ['merchant_id', 'merchant_key', 'return_url', 'cancel_url', 'notify_url']);
  assert.equal(get('amount'), '1599.00');
  assert.equal(get('cell_number'), '0821234567');
  assert.equal(get('name_last'), 'van der Nkosi');
  assert.equal(get('notify_url'), 'https://plentovo.com/api/payfast/itn');
  assert.equal(get('m_payment_id'), 'AM-O-ABC');
});

// --- recording the payment and alerting staff ---
async function harness() {
  const pg = new PGlite();
  await pg.exec(`CREATE TABLE experience_records(id text PRIMARY KEY, kind text, reference text UNIQUE, status text, data jsonb, version int DEFAULT 1, updated_at timestamptz DEFAULT now());
    CREATE TABLE experience_events(id text PRIMARY KEY, record_id text, actor_id text, type text, note text, data jsonb, created_at timestamptz DEFAULT now());`);
  const tx: Tx = async work => { await pg.query('BEGIN'); try { const v = await work(pg as unknown as Queryable); await pg.query('COMMIT'); return v; } catch (e) { await pg.query('ROLLBACK'); throw e; } };
  const add = async (id: string, data: Record<string, unknown>, status = 'CONFIRMED') => { const r = await order(); assert.ok(r.ok); if (!r.ok) return; await pg.query('INSERT INTO experience_records(id,kind,reference,status,data) VALUES($1,$2,$3,$4,$5)', [id, 'ORDER', `AM-O-${id}`, status, JSON.stringify({...r.data, ...data})]); };
  return {pg, tx, add};
}
const pay = {paymentRef: '1089250', grossCents: 129900 + 7900, feeCents: 5000, netCents: 132800, mode: 'sandbox'};

test('a verified payment moves the order to PAID once and only for the exact amount', async () => {
  const h = await harness();
  await h.add('A', {});
  assert.deepEqual(await findAwaiting('AM-O-A', h.tx), {id: 'A', totalCents: 137800, paid: false});
  assert.equal(await findAwaiting('AM-O-NOPE', h.tx), null);
  assert.deepEqual(await recordPayment('AM-O-A', {...pay, grossCents: 1}, h.tx), {status: 'amount_mismatch'});
  assert.deepEqual(await recordPayment('AM-O-A', pay, h.tx), {status: 'paid', id: 'A'});
  assert.deepEqual(await recordPayment('AM-O-A', pay, h.tx), {status: 'already_paid', id: 'A'});
  const row = (await h.pg.query("SELECT status,data FROM experience_records WHERE id='A'")).rows[0] as any;
  assert.equal(row.status, 'PAID');
  assert.equal(row.data.paymentVerified, true);
  assert.equal(row.data.awaitingPayment, false);
  assert.equal(row.data.paymentRef, '1089250');
  assert.equal((await h.pg.query("SELECT count(*)::int AS n FROM experience_events WHERE type='PAYMENT_VERIFIED'")).rows[0].n, 1);
});
test('orders that are not waiting on Payfast cannot be marked paid by a notification', async () => {
  const h = await harness();
  await h.add('B', {awaitingPayment: false}, 'CONFIRMED');
  await h.add('C', {}, 'CANCELLED');
  await h.add('D', {paymentProvider: 'MANUAL'});
  for (const id of ['B', 'C']) assert.deepEqual(await recordPayment(`AM-O-${id}`, pay, h.tx), {status: 'not_awaiting'});
  assert.deepEqual(await recordPayment('AM-O-D', pay, h.tx), {status: 'not_found'});
  assert.deepEqual(await recordPayment('AM-O-X', pay, h.tx), {status: 'not_found'});
});
test('after payment is recorded, the staff alert can be sent for the order', async () => {
  const h = await harness();
  await h.add('E', {});
  const sent: string[] = [];
  const nd: Deps = {transaction: h.tx, send: async m => { sent.push(m.subject); return 'id'; }, recipients: ['ops@plentovo.com'], fees: {percent: null, fixedCents: null}};
  assert.equal((await notifyPaidOrder('E', {}, nd)).status, 'not_eligible');
  const paid = await recordPayment('AM-O-E', pay, h.tx);
  assert.equal(paid.status, 'paid');
  assert.equal((await notifyPaidOrder('E', {}, nd)).status, 'sent');
  assert.equal(sent.length, 1);
  assert.match(sent[0], /Paid order AM-O-E: R1\s378[.,]00/);
});

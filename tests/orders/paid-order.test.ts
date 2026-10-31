import assert from 'node:assert/strict';
import {test} from 'node:test';
import {PGlite} from '@electric-sql/pglite';
import {buildAlert, checklist, marginSummary, parsePaidOrder, rand, warnings} from '../../src/lib/orders/paid-order';
import {feesFrom, notifyPaidOrder, recipientsFrom, type Deps, type Queryable} from '../../src/lib/orders/notify';

const base = {
  country: 'ZA', currency: 'ZAR', paymentVerified: true, customerName: 'Thandi Nkosi', phone: '0821234567', email: 'thandi@example.com', city: 'Centurion', postcode: '0157',
  deliveryMethod: 'DELIVERY', deliveryAddress: ['12 Protea Road', 'Centurion', '0157'], shippingCents: 7900, paymentRef: 'PF-1001', paidAt: '2026-10-30 12:00',
  items: [
    {id: 'a:1', slug: 'air-fryer-8l', name: 'Air fryer 8L', option: 'Black', quantity: 1, unitPriceCents: 129900, supplierCostCents: 94900},
    {id: 'b:2', slug: 'lunch-box', name: 'Lunch box', option: 'Standard', quantity: 2, unitPriceCents: 9900, supplierCostCents: 5000},
  ],
};
const row = (data: Record<string, unknown> = {}, status = 'PAID') => ({id: 'ord-1', reference: 'AM-O-ABC123', status, data: {...base, ...data}});
const fees = {percent: 3.5, fixedCents: 200};

test('a complete paid order parses, with the delivery fee kept separate from items', () => {
  const r = parsePaidOrder(row());
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.value.deliveryCents, 7900);
  assert.equal(r.value.totalCents, 129900 + 2 * 9900 + 7900);
  assert.equal(r.value.items[0].supplierUrl, 'https://perfectdealz.co.za/products/air-fryer-8l');
});
test('bad or incomplete orders are rejected with reasons, never guessed', () => {
  const cases: [Record<string, unknown>, RegExp][] = [
    [{country: 'TN'}, /not a South African/],
    [{items: []}, /no items/],
    [{items: [{name: 'X', quantity: 0, unitPriceCents: 100}]}, /invalid name, quantity or price/],
    [{items: [{name: 'X', quantity: 1, unitPriceCents: 0}]}, /invalid name, quantity or price/],
    [{shippingCents: null}, /Delivery fee was not recorded/],
    [{totalCents: 1}, /does not equal items plus delivery/],
    [{phone: ''}, /name or phone/],
    [{deliveryAddress: ['Only one line']}, /address is incomplete/],
  ];
  for (const [patch, expected] of cases) {
    const r = parsePaidOrder(row(patch));
    assert.ok(!r.ok, JSON.stringify(patch));
    if (!r.ok) assert.match(r.problems.join(' '), expected);
  }
});
test('margin is items minus supplier price; delivery is not margin; fees are only used when configured', () => {
  const r = parsePaidOrder(row());
  assert.ok(r.ok);
  if (!r.ok) return;
  const m = marginSummary(r.value, fees);
  assert.equal(m.supplierCents, 94900 + 2 * 5000);
  assert.equal(m.grossCents, 129900 + 19800 - 104900);
  assert.equal(m.feeCents, Math.round(r.value.totalCents * 0.035) + 200);
  assert.equal(m.afterFeeCents, m.grossCents! - m.feeCents!);
  const none = marginSummary(r.value, {percent: null, fixedCents: null});
  assert.equal(none.feeCents, null);
  assert.equal(none.afterFeeCents, null);
});
test('warnings flag missing supplier prices, below-cost sales and collection', () => {
  const r = parsePaidOrder(row({items: [{name: 'Lamp', slug: 'lamp', quantity: 1, unitPriceCents: 5000, supplierCostCents: 5000}, {name: 'Mat', slug: 'mat', quantity: 1, unitPriceCents: 9900}], deliveryMethod: 'COLLECTION', email: ''}));
  assert.ok(r.ok);
  if (!r.ok) return;
  const w = warnings(r.value, fees).join(' | ');
  assert.match(w, /collection/);
  assert.match(w, /not recorded for every item/);
  assert.match(w, /"Lamp" sold at or below/);
  assert.match(w, /No customer email/);
});
test('the alert escapes customer text and carries the checklist and amounts', () => {
  const r = parsePaidOrder(row({customerName: '<script>alert(1)</script> Mo', deliveryAddress: ['1 <b>Street</b>', 'Pretoria', '0001']}));
  assert.ok(r.ok);
  if (!r.ok) return;
  const {subject, html} = buildAlert(r.value, fees);
  assert.equal(subject, `Paid order AM-O-ABC123: ${rand(r.value.totalCents)}`);
  assert.ok(!html.includes('<script>alert'));
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /1 &lt;b&gt;Street/);
  assert.match(html, /Open at Perfect Dealz/);
  assert.match(html, /blank, no-price packaging/);
  assert.match(html, /Margin after Payfast fee/);
  assert.equal(checklist(r.value).length, 7);
  assert.match(buildAlert(r.value, fees, true).subject, /^Reminder: /);
});
test('config parsing ignores junk', () => {
  assert.deepEqual(recipientsFrom('Ops@Plentovo.com, bad, ops@plentovo.com; hello@plentovo.com'), ['ops@plentovo.com', 'hello@plentovo.com']);
  assert.deepEqual(recipientsFrom(undefined), []);
  assert.deepEqual(feesFrom({PAYFAST_FEE_PERCENT: '3.5', PAYFAST_FEE_FIXED_CENTS: 'x'}), {percent: 3.5, fixedCents: null});
});

async function harness(opts: {recipients?: string[]; failSend?: () => boolean} = {}) {
  const pg = new PGlite();
  await pg.exec(`CREATE TABLE experience_records(id text PRIMARY KEY, kind text, reference text, status text, data jsonb);
    CREATE TABLE experience_events(id text PRIMARY KEY, record_id text, actor_id text, type text, note text, data jsonb, created_at timestamptz DEFAULT now());`);
  const sent: {to: string; subject: string; key: string}[] = [];
  const deps: Deps = {
    transaction: async work => { await pg.query('BEGIN'); try { const v = await work(pg as unknown as Queryable); await pg.query('COMMIT'); return v; } catch (e) { await pg.query('ROLLBACK'); throw e; } },
    send: async m => { if (opts.failSend?.()) throw new Error('provider down'); sent.push({to: m.to, subject: m.subject, key: m.idempotencyKey}); return `id-${sent.length}`; },
    recipients: opts.recipients ?? ['ops@plentovo.com'], fees,
  };
  const add = (id: string, status: string, data: Record<string, unknown>, kind = 'ORDER') => pg.query('INSERT INTO experience_records VALUES($1,$2,$3,$4,$5)', [id, kind, `AM-O-${id}`, status, JSON.stringify(data)]);
  const events = async (id: string) => (await pg.query('SELECT type FROM experience_events WHERE record_id=$1 ORDER BY created_at, id', [id])).rows.map((r: any) => r.type);
  return {pg, deps, sent, add, events};
}

test('a verified paid order sends once and is not sent twice', async () => {
  const h = await harness();
  await h.add('o1', 'PAID', base);
  assert.deepEqual(await notifyPaidOrder('o1', {}, h.deps), {status: 'sent', recipients: 1, resend: false});
  assert.deepEqual(await notifyPaidOrder('o1', {}, h.deps), {status: 'already_sent'});
  assert.equal(h.sent.length, 1);
  assert.deepEqual(await h.events('o1'), ['FULFILMENT_ALERT_SENT']);
});
test('a deliberate resend sends again with a new idempotency key', async () => {
  const h = await harness({recipients: ['a@plentovo.com', 'b@plentovo.com']});
  await h.add('o1', 'FULFILMENT', base);
  await notifyPaidOrder('o1', {}, h.deps);
  const again = await notifyPaidOrder('o1', {force: true, actor: 'staff-1'}, h.deps);
  assert.deepEqual(again, {status: 'sent', recipients: 2, resend: true});
  assert.equal(h.sent.length, 4);
  assert.equal(new Set(h.sent.map(s => s.key)).size, 4);
  assert.match(h.sent[2].subject, /^Reminder: /);
});
test('orders that are not verified paid never send', async () => {
  const h = await harness();
  await h.add('enq', 'ENQUIRY', base);
  await h.add('unverified', 'PAID', {...base, paymentVerified: false});
  await h.add('flagless', 'PAID', {...base, paymentVerified: 'true'});
  await h.add('case1', 'PAID', base, 'CASE');
  for (const id of ['enq', 'unverified', 'flagless', 'case1']) {
    const r = await notifyPaidOrder(id, {}, h.deps);
    assert.ok(['not_eligible', 'not_found'].includes(r.status), `${id}: ${r.status}`);
  }
  assert.deepEqual(await notifyPaidOrder('missing', {}, h.deps), {status: 'not_found'});
  assert.equal(h.sent.length, 0);
});
test('an invalid paid order is reported, not emailed with guessed data', async () => {
  const h = await harness();
  await h.add('bad', 'PAID', {...base, shippingCents: null});
  const r = await notifyPaidOrder('bad', {}, h.deps);
  assert.equal(r.status, 'invalid_order');
  assert.equal(h.sent.length, 0);
});
test('no recipients configured fails closed', async () => {
  const h = await harness({recipients: []});
  await h.add('o1', 'PAID', base);
  assert.deepEqual(await notifyPaidOrder('o1', {}, h.deps), {status: 'not_configured'});
  assert.equal(h.sent.length, 0);
});
test('a failed send is recorded and a retry then succeeds', async () => {
  let fail = true;
  const h = await harness({failSend: () => fail});
  await h.add('o1', 'PAID', base);
  const first = await notifyPaidOrder('o1', {}, h.deps);
  assert.equal(first.status, 'send_failed');
  assert.deepEqual(await h.events('o1'), ['FULFILMENT_ALERT_FAILED']);
  fail = false;
  assert.equal((await notifyPaidOrder('o1', {}, h.deps)).status, 'sent');
  assert.deepEqual(await h.events('o1'), ['FULFILMENT_ALERT_FAILED', 'FULFILMENT_ALERT_SENT']);
});

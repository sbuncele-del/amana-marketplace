import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHmac} from 'node:crypto';
import {parseEvent, problemEvent, verifyWebhook} from '../../apps/tunisia/lib/mail/resend-webhook';

const secretBytes = Buffer.from('tunisia-test-signing-key');
const secret = `whsec_${secretBytes.toString('base64')}`;
const now = 1_800_000_000_000;
const body = JSON.stringify({type: 'email.delivered', data: {email_id: 'em_1', to: ['orders@plentovo.com'], subject: 'New order'}});
const sign = (id: string, ts: string, b: string) => `v1,${createHmac('sha256', secretBytes).update(`${id}.${ts}.${b}`).digest('base64')}`;
const ts = String(now / 1000);

test('a correctly signed, fresh webhook is accepted', () => {
  assert.equal(verifyWebhook(body, {id: 'msg_1', timestamp: ts, signature: sign('msg_1', ts, body)}, secret, now), true);
});
test('a second signature in the header is enough (key rotation)', () => {
  assert.equal(verifyWebhook(body, {id: 'msg_1', timestamp: ts, signature: `v1,AAAA ${sign('msg_1', ts, body)}`}, secret, now), true);
});
test('a changed body, wrong secret, missing headers or old timestamp are rejected', () => {
  const sig = sign('msg_1', ts, body);
  assert.equal(verifyWebhook(body + ' ', {id: 'msg_1', timestamp: ts, signature: sig}, secret, now), false);
  assert.equal(verifyWebhook(body, {id: 'msg_1', timestamp: ts, signature: sig}, `whsec_${Buffer.from('other').toString('base64')}`, now), false);
  assert.equal(verifyWebhook(body, {id: null, timestamp: ts, signature: sig}, secret, now), false);
  assert.equal(verifyWebhook(body, {id: 'msg_1', timestamp: ts, signature: null}, secret, now), false);
  assert.equal(verifyWebhook(body, {id: 'msg_1', timestamp: ts, signature: sig}, '', now), false);
  const old = String(now / 1000 - 3600);
  assert.equal(verifyWebhook(body, {id: 'msg_1', timestamp: old, signature: sign('msg_1', old, body)}, secret, now), false);
});
test('events are parsed safely and problem events flagged', () => {
  assert.deepEqual(parseEvent(body), {type: 'email.delivered', emailId: 'em_1', to: ['orders@plentovo.com'], subject: 'New order'});
  assert.equal(parseEvent('not json'), null);
  assert.equal(parseEvent('{"data":{}}'), null);
  assert.equal(problemEvent('email.bounced'), true);
  assert.equal(problemEvent('email.delivered'), false);
});

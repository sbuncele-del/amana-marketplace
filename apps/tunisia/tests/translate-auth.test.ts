import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAnthropicTranslator, fillTranslations} from '../lib/import/translate';
import {bearerMatches, parseIds} from '../lib/import/auth';
import {content} from './helpers';
test('missing locales are filled from the best source and marked machine / needs review', async () => {
 const rec = content(1, {title: {en: '', fr: 'Chaise', ar: ''}, description: {en: '', fr: 'Une chaise en bois.', ar: ''}});
 const calls: string[] = [];
 const {record, translated} = await fillTranslations(rec, async ({text, from, to}) => { calls.push(`${from}>${to}`); return `[${to}] ${text}`; });
 assert.equal(translated, 4); assert.deepEqual(calls.sort(), ['fr>ar', 'fr>ar', 'fr>en', 'fr>en']);
 assert.deepEqual([record.provenance.fr, record.provenance.en, record.provenance.ar, record.reviewState], ['curated', 'machine', 'machine', 'needs_review']);
 assert.equal(record.title.fr, 'Chaise');
 assert.equal(rec.title.en, '', 'the input record is not mutated');
});
test('complete content is left untouched', async () => {
 const {translated, record} = await fillTranslations(content(2), async () => { throw new Error('should not be called'); });
 assert.equal(translated, 0); assert.equal(record.reviewState, 'approved');
});
test('the Anthropic translator sends a faithful-translation prompt and reads the text back', async () => {
 let sent: any, headers: any;
 const fetchImpl = (async (_url: string, init: any) => { sent = JSON.parse(init.body); headers = init.headers; return new Response(JSON.stringify({content: [{type: 'text', text: ' Chair '}]})); }) as unknown as typeof fetch;
 const out = await createAnthropicTranslator({apiKey: 'k', fetchImpl})({text: 'Chaise', from: 'fr', to: 'en', kind: 'title'});
 assert.equal(out, ' Chair '); assert.match(sent.system, /do not add, remove or strengthen/); assert.equal(headers['x-api-key'], 'k'); assert.equal(sent.messages[0].content, 'Chaise');
});
test('bearer auth fails closed and compares safely', () => {
 const secret = 'a'.repeat(32);
 assert.equal(bearerMatches(`Bearer ${secret}`, secret), true);
 assert.equal(bearerMatches(`Bearer ${secret}x`, secret), false);
 assert.equal(bearerMatches(null, secret), false);
 assert.equal(bearerMatches(`Bearer ${secret}`, undefined), false);
 assert.equal(bearerMatches('Bearer short', 'short'), false); // secrets under 16 characters are rejected outright
});
test('cart ids are validated and limited', () => {
 assert.deepEqual(parseIds('a-1,b2,a-1'), ['a-1', 'b2']);
 assert.equal(parseIds("a'; DROP TABLE x"), null);
 assert.equal(parseIds(Array.from({length: 51}, (_, i) => `id${i}`).join(',')), null);
 assert.deepEqual(parseIds(null), []);
});

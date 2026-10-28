import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decide, type DecisionInput} from '../lib/import/decide';
import {indexContent, matchContent, parseContent} from '../lib/import/content';
import {baseConfig, content} from './helpers';
const config = baseConfig();
const index = indexContent([content(1)]);
const base = (over: Partial<DecisionInput> = {}): DecisionInput => ({status: 'active', missing: false, match: matchContent({uuid: 'acct-1', link: null, name: 'Product 1'}, index), accountPrice: 25000, recommendedPrice: null, cost: 12500, stock: 5, dataErrors: [], ...over});
test('complete active product with content and a price is published', () => assert.deepEqual(decide(base(), config), {state: 'published', reasons: [], price: 25000, basis: 'account'}));
test('no matching content stays pending with a reason', () => {
 const d = decide(base({match: {record: null, method: 'none'}}), config);
 assert.equal(d.state, 'pending'); assert.deepEqual(d.reasons, ['no_content']);
});
test('missing price and inactive status are reported together', () => {
 const d = decide(base({accountPrice: null, status: 'draft'}), config);
 assert.deepEqual(d.reasons.sort(), ['inactive', 'no_price']);
});
test('an incomplete translation or missing image blocks publication', () => {
 const rec = parseContent({...content(2), title: {en: 'A', fr: '', ar: 'ب'}, images: ['https://example.com/x.jpg']});
 assert.ok(rec.ok);
 const d = decide(base({match: {record: rec.ok ? rec.value : null, method: 'uuid'}}), config);
 assert.ok(d.reasons.includes('incomplete_title_fr')); assert.ok(d.reasons.includes('no_image')); assert.equal(d.state, 'pending');
});
test('machine translations awaiting review are held back unless explicitly allowed', () => {
 const machine = content(3, {reviewState: 'needs_review', provenance: {en: 'machine', fr: 'supplier', ar: 'machine'}});
 const input = base({match: {record: machine, method: 'uuid'}});
 assert.deepEqual(decide(input, config).reasons, ['translation_needs_review']);
 assert.equal(decide(input, baseConfig({TUNISIA_PUBLISH_MACHINE_TRANSLATIONS: 'true'})).state, 'published');
});
test('below-cost prices are held by default and publishable when the block is switched off', () => {
 const input = base({accountPrice: 10000, cost: 12500});
 assert.deepEqual(decide(input, config).reasons, ['price_below_cost']);
 assert.equal(decide(input, baseConfig({TUNISIA_BLOCK_BELOW_COST: 'false'})).state, 'published');
});
test('provisional prices publish only when enabled and are flagged', () => {
 const input = base({accountPrice: null});
 assert.equal(decide(input, config).state, 'pending');
 const d = decide(input, baseConfig({TUNISIA_PROVISIONAL_PRICING: 'markup', TUNISIA_PROVISIONAL_MARKUP_PCT: '40'}));
 assert.equal(d.state, 'published'); assert.equal(d.basis, 'provisional'); assert.deepEqual(d.reasons, ['provisional_price']); assert.ok(d.price! > 12500);
});
test('unparseable supplier data is failed, not guessed', () => {
 const d = decide(base({dataErrors: ['invalid_price']}), config);
 assert.deepEqual([d.state, d.price], ['failed', null]);
});
test('content matching: uuid, then link, then unique name; duplicate names are ambiguous', () => {
 const idx = indexContent([content(1), content(2, {sourceName: 'Dup'}), content(3, {sourceName: 'Dup'})]);
 assert.equal(matchContent({uuid: 'mkt-1', name: 'x'}, idx).method, 'uuid');
 assert.equal(matchContent({uuid: 'acct', link: 'https://app.shipper.market/products/mkt-1', name: 'x'}, idx).method, 'link');
 assert.equal(matchContent({uuid: 'acct', name: 'Product 1'}, idx).method, 'name');
 assert.equal(matchContent({uuid: 'acct', name: 'Dup'}, idx).method, 'ambiguous');
 assert.equal(matchContent({uuid: 'acct', name: 'Nope'}, idx).method, 'none');
});
test('image hosts are an allowlist', () => {
 const bad = parseContent({...content(4), images: ['http://cdn.shipper.network/a.jpg', 'https://evil.example/a.jpg']});
 assert.ok(bad.ok);
 assert.ok(decide(base({match: {record: bad.ok ? bad.value : null, method: 'uuid'}}), config).reasons.includes('no_image'));
});

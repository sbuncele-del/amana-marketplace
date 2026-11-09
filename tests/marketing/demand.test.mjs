import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parameters, evidence, batches } from '../../src/lib/marketing/demand.mjs';
test('fixed ZA requests distinguish Web and Shopping and reject arbitrary input', () => {
  assert.equal(parameters('outdoor','30d','shopping').gprop,'froogle');
  assert.equal(parameters('outdoor','7d','web').geo,'ZA');
  assert.throws(()=>parameters('__proto__','7d','web'));
  assert.throws(()=>parameters('outdoor','all','web'));
  for(const terms of Object.values(batches)) { assert.equal(terms[0],'air fryer'); assert.ok(terms.length<=5); }
});
test('missing data is unverified and zero data is not fabricated demand', () => {
  assert.equal(evidence({},['fan']).status,'unverified');
  const payload={interest_over_time:{timeline_data:Array.from({length:8},()=>({values:[{query:'fan',extracted_value:0}]}))}};
  assert.equal(evidence(payload,['fan']).summaries[0].status,'insufficient_data');
});
test('indexes are matched by query and partial periods excluded from movement', () => {
  const payload={interest_over_time:{timeline_data:[1,1,1,2,2,2,100].map((v,i)=>({partial_data:i===6,values:[{query:'other',extracted_value:99},{query:'fan',extracted_value:v}]}))}};
  const result=evidence(payload,['fan']);
  assert.equal(result.summaries[0].changePercent,100);
  assert.equal(result.summaries[0].points,6);
  assert.equal(result.series.length,7);
  assert.equal(result.series[0].values[0].index,1);
});

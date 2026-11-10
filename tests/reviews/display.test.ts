import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectReviews} from '../../src/lib/review-display';
const reviews=[{id:'negative',rating:1,verified:true,createdAt:'2026-11-01'},{id:'positive',rating:5,verified:false,createdAt:'2026-11-02'},{id:'recent',rating:5,verified:true,createdAt:'2026-11-03'}];
test('sorts all ratings without mutating original reviews',()=>{
 assert.deepEqual(selectReviews(reviews,{sort:'highest',stars:0,verifiedOnly:false}).map(r=>r.id),['recent','positive','negative']);
 assert.equal(selectReviews(reviews,{sort:'lowest',stars:0,verifiedOnly:false})[0].id,'negative');
 assert.equal(selectReviews(reviews,{sort:'newest',stars:0,verifiedOnly:false})[0].id,'recent');
 assert.equal(reviews[0].id,'negative');
});
test('combines exact rating and verified filters and preserves negative feedback',()=>{
 assert.deepEqual(selectReviews(reviews,{sort:'newest',stars:1,verifiedOnly:true}).map(r=>r.id),['negative']);
 assert.deepEqual(selectReviews(reviews,{sort:'newest',stars:5,verifiedOnly:true}).map(r=>r.id),['recent']);
 assert.deepEqual(selectReviews(reviews,{sort:'newest',stars:3,verifiedOnly:true}),[]);
});

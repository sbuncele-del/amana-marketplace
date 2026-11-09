import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parameters} from '../../src/lib/marketing/demand.mjs';
import {rankDemand} from '../../src/lib/marketing/demand-priority.mjs';
import {tunisiaIntents} from '../../packages/storefront/tunisia-demand-config.mjs';
const now=Date.parse('2026-11-10T00:00:00Z');
const options={geography:'TN',definitions:tunisiaIntents};
const p=(slug,name)=>({slug,name,price:99,images:['actual.jpg']});
function proof(term,geography='TN'){return ['7d','30d','90d','12m'].map(window=>({geography,window,batch:'beauty',searchType:'web',status:'retrieved',observedAt:new Date(now-1000).toISOString(),sourceUrl:'https://trends.google.com/trends/explore?geo='+geography,summaries:[{term,status:'observed',recentMean:12,changePercent:30},{term:'air fryer',status:'observed',recentMean:50,changePercent:0}],series:Array.from({length:40},()=>({values:[{term,index:12}]}))}));}
test('Tunisia uses local terms and geo without changing RSA requests',()=>{
 const params=parameters('beauty','90d','web','TN');assert.equal(params.geo,'TN');assert.equal(params.hl,'fr');assert.match(params.q,/sèche cheveux/);
 assert.equal(parameters('beauty','90d','web').geo,'ZA');assert.throws(()=>parameters('beauty','90d','web','US'));
});
test('RSA evidence never qualifies a Tunisian product, and vice versa',()=>{
 const products=[p('dryer','Sèche cheveux professionnel')];
 assert.equal(rankDemand(products,proof('sèche cheveux','ZA'),now,50,options).qualifiedCount,0);
 assert.equal(rankDemand(products,proof('sèche cheveux'),now).qualifiedCount,0);
 const report=rankDemand(products,proof('sèche cheveux'),now,50,options);assert.equal(report.qualifiedCount,1);assert.match(report.entries[0].evidence[0].note,/TN web/);assert.equal(report.entries[0].subscores.margin,null);
});
test('Appliance demand does not promote accessories or unrelated clinical products',()=>{
 const report=rankDemand([p('fryer','Friteuse sans huile 6L'),p('liner','Papier pour friteuse sans huile'),p('cream','Crème articulations')],proof('friteuse sans huile'),now,50,options);
 assert.deepEqual(report.entries.map(p=>p.slug),['fryer']);
});
test('Tunisia does not pad to fifty or promote recent declines',()=>{
 const records=proof('sèche cheveux');records[0].summaries[0].changePercent=-50;
 assert.equal(rankDemand([p('dryer','Hair dryer')],records,now,50,options).qualifiedCount,0);
});

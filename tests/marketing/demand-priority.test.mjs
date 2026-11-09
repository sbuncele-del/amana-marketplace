import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rankDemand,applyPriority} from '../../src/lib/marketing/demand-priority.mjs';
const now=Date.parse('2026-11-09T16:00:00Z');
function record(term,window='30d',overrides={}){return {geography:'ZA',status:'retrieved',observedAt:new Date(now-10000).toISOString(),batch:'home',window,searchType:'web',sourceUrl:'https://trends.google.com/trends/explore?geo=ZA',summaries:[{term,status:'observed',recentMean:10,changePercent:20},{term:'air fryer',status:'observed',recentMean:50,changePercent:0}],series:Array.from({length:40},()=>({partial:false,values:[{term,index:10}]})),...overrides};}
const proof=term=>['7d','30d','90d','12m'].map(w=>record(term,w));
const product=(slug,name)=>({slug,name,price:100,images:['actual.png']});
test('one recent spike, missing persistence and stale or future evidence cannot create a priority',()=>{
 const p=[product('rack','Shoe rack')];
 assert.equal(rankDemand(p,[record('shoe rack')],now).qualifiedCount,0);
 for(const observedAt of [new Date(now-8*86400000).toISOString(),new Date(now+1000).toISOString()])assert.equal(rankDemand(p,proof('shoe rack').map(r=>({...r,observedAt})),now).qualifiedCount,0);
 assert.equal(rankDemand(p,proof('shoe rack').map(r=>({...r,geography:'US'})),now).qualifiedCount,0);
});
test('appliance interest does not promote liners and margins remain unknown',()=>{
 const r=rankDemand([product('fryer','6L Air Fryer'),product('liner','Silicone Air Fryer Liner')],proof('air fryer'),now);
 assert.deepEqual(r.entries.map(p=>p.slug),['fryer']);assert.equal(r.entries[0].subscores.margin,null);assert.equal(r.entries[0].provisional,true);
});
test('recent material decline is a watchlist rather than an opening product',()=>{
 const records=proof('shoe rack');records.find(r=>r.window==='7d').summaries[0].changePercent=-40;
 assert.equal(rankDemand([product('rack','Shoe rack')],records,now).qualifiedCount,0);
});
test('qualified count never pads to fifty and separate intents interleave',()=>{
 const products=Array.from({length:12},(_,i)=>product('rack-'+i,'Shoe rack '+i));products.push(product('cooler','10L Cooler Box'));
 const r=rankDemand(products,[...proof('shoe rack'),...proof('cooler box')],now);
 assert.equal(r.qualifiedCount,11);assert.equal(r.entries[0].term,'cooler box');assert.equal(r.entries[1].term,'shoe rack');assert.equal(new Set(r.entries.map(p=>p.slug)).size,11);
});
test('priority ordering preserves the rest and pagination has no omissions or duplicates',()=>{
 const products=['a','b','c','d','e'].map(slug=>({slug}));const ordered=applyPriority(products,['d','b']);
 assert.deepEqual(ordered.map(p=>p.slug),['d','b','a','c','e']);
 assert.deepEqual([...ordered.slice(0,2),...ordered.slice(2,4),...ordered.slice(4)].map(p=>p.slug),ordered.map(p=>p.slug));
});

test('camping-chair intent excludes wheelchairs and stepping stools',()=>{
 const r=rankDemand([product('medical','Lightweight Stylish Padded Folding Wheelchair'),product('step','Plastic Folding Stepping Chair'),product('camp','Folding Camping Lounge Chair With Footrest')],proof('camping chair'),now);
 assert.deepEqual(r.entries.map(p=>p.slug),['camp']);
});

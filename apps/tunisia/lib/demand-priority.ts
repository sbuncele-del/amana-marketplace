import 'server-only';
import {unstable_cache} from 'next/cache';
import {rankDemand} from '../../../src/lib/marketing/demand-priority.mjs';
import {tunisiaIntents} from '../../../packages/storefront/tunisia-demand-config.mjs';
import type {ProductGroup} from './product-groups';
const research=unstable_cache(async()=>{
 const response=await fetch('https://plentovo.com/api/marketing/tunisia-trends',{cache:'no-store',signal:AbortSignal.timeout(6000)});
 if(!response.ok)throw new Error('Tunisia research unavailable');
 const data=await response.json();
 return data.geography==='TN'&&Array.isArray(data.records)?data.records:[];
},['tunisia-search-research-v1'],{revalidate:60});
export async function tunisiaPriority(groups:ProductGroup[]){
 const products=groups.filter(p=>p.stock>0&&p.image&&p.priceMillimes>0).map(p=>({slug:p.slug,name:Object.values(p.title).join(' '),price:p.priceMillimes/1000,images:[p.image]}));
 let records=[];try{records=await research();}catch{}
 const report=rankDemand(products,records,Date.now(),50,{geography:'TN',definitions:tunisiaIntents});
 return {...report,entries:report.entries.map(p=>({...p,subscores:{...p.subscores,supply:18},knownScore:p.knownScore+18,knownMaximum:80,availabilityBasis:'Current Tunisian storefront supplier snapshot; delivery and landed margin unverified.'}))};
}

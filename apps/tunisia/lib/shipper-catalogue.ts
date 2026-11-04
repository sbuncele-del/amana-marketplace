import 'server-only';
import {cache} from 'react';
import {gzipSync,gunzipSync} from 'node:zlib';
import {unstable_cache} from 'next/cache';
import content from '@/data/shipper-content-index';
import {normaliseShipper,type SupplierContent} from './shipper-normalise';
import {supplierContent} from './private-supplier-content';
import {validateCatalogue} from './catalogue';

// Cache the validated snapshot, never individual pages from different sync runs.
// If a refresh fails, Next retains the last successful whole snapshot.
const legacySnapshot=unstable_cache(async()=>{
 const token=process.env.SHIPPER_NETWORK_API_KEY||process.env.TUNISIA_SHIPPER_API_KEY;
 if(!token)throw new Error('Supplier credential unavailable');
 const rows=[];const seen=new Set<string>();let lastPage=1;
 for(let page=1;page<=lastPage;page++){
  // Stay below the provider's read budget, including a complete 12k catalogue.
  if(page>1)await new Promise(resolve=>setTimeout(resolve,650));
  // The provider rate-limits full-catalogue reads; wait out Retry-After (capped) and retry the same page instead of failing the whole snapshot.
  let response:Response|undefined;
  for(let attempt=0;attempt<4;attempt++){
   response=await fetch(`https://server.shipper.network/api/v1/products?per_page=100&page=${page}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000),cache:'no-store'});
   if(response.status!==429||attempt===3)break;
   const wait=Number(response.headers.get('retry-after'));
   await new Promise(resolve=>setTimeout(resolve,Math.min(Number.isFinite(wait)&&wait>0?wait*1000:3000*(attempt+1),15000)));
  }
  if(!response!.ok){
   const retry=response!.headers.get('retry-after');
   throw new Error(`Supplier HTTP ${response!.status}${response!.status===429&&retry?' (retry after '+retry+')':''}`);
  }
  const data=await response!.json();if(!Array.isArray(data.data))throw new Error('Invalid supplier catalogue');
  for(const row of data.data){
   // Products can shift between pages while the retailer is adding new items.
   if(typeof row.uuid==='string'){if(seen.has(row.uuid))continue;seen.add(row.uuid);}
   // Cache compact retail records; never cache wholesale cost or repeat galleries/copy.
   rows.push({uuid:row.uuid,name:row.name,link:row.link,price:row.price,available_qte:row.available_qte,status:row.status,variants:Array.isArray(row.variants)?row.variants.map((variant:{uuid:unknown;name:unknown;price:unknown;available_qte:unknown})=>({uuid:variant.uuid,name:variant.name,price:variant.price,available_qte:variant.available_qte})):[]});
  }
  if(page===1){
   const last=Number(data.pagination?.last_page);
   if(Number.isInteger(last)&&last>=1){if(last>150)throw new Error('Catalogue exceeds verified import limit');lastPage=last;}
   else if(data.data.length>=100)throw new Error('Missing supplier pagination');
  }
 }
 const published=validateCatalogue(normaliseShipper(rows,content as SupplierContent[]));
 if(rows.length&&!published.length)throw new Error('No verified products in supplier snapshot');
 return rows;
},['tunisia-shipper-complete-snapshot-v4'],{revalidate:1800,tags:['tunisia-shipper-catalogue']});

// The provider rate-limits full-catalogue reads. A failed refresh is not cached, so every request after expiry (in every region)
// used to restart a ~60-call refresh and keep the limit tripped, which pinned the shop on an old snapshot.
// After a failure this instance now stays off the provider for a while; the cache keeps serving its last good snapshot meanwhile.
let coolDownUntil=0;
const COOL_DOWN_MS=5*60*1000,MAX_COOL_DOWN_MS=30*60*1000;
async function fetchSnapshot(){
 const token=process.env.SHIPPER_NETWORK_API_KEY||process.env.TUNISIA_SHIPPER_API_KEY;
 if(!token)throw new Error('Supplier credential unavailable');
 const rows=[];const seen=new Set<string>();let lastPage=1;
 for(let page=1;page<=lastPage;page++){
  // Stay below the provider's read budget, including a complete 12k catalogue.
  if(page>1)await new Promise(resolve=>setTimeout(resolve,1500));
  // The provider rate-limits full-catalogue reads; wait out Retry-After (capped) and retry the same page instead of failing the whole snapshot.
  let response:Response|undefined;
  for(let attempt=0;attempt<4;attempt++){
   response=await fetch(`https://server.shipper.network/api/v1/products?per_page=100&page=${page}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000),cache:'no-store'});
   if(response.status!==429||attempt===3)break;
   const wait=Number(response.headers.get('retry-after'));
   if(wait>15)break;
   await new Promise(resolve=>setTimeout(resolve,Math.min(Number.isFinite(wait)&&wait>0?wait*1000:3000*(attempt+1),15000)));
  }
  if(!response!.ok){
   const retry=response!.headers.get('retry-after');
   throw new Error(`Supplier HTTP ${response!.status}${response!.status===429&&retry?' (retry after '+retry+')':''}`);
  }
  const data=await response!.json();if(!Array.isArray(data.data))throw new Error('Invalid supplier catalogue');
  for(const row of data.data){
   // Products can shift between pages while the retailer is adding new items.
   if(typeof row.uuid==='string'){if(seen.has(row.uuid))continue;seen.add(row.uuid);}
   // Cache compact retail records; never cache wholesale cost or repeat galleries/copy.
   rows.push({uuid:row.uuid,name:row.name,link:row.link,price:row.price,available_qte:row.available_qte,status:row.status,variants:Array.isArray(row.variants)?row.variants.map((variant:{uuid:unknown;name:unknown;price:unknown;available_qte:unknown})=>({uuid:variant.uuid,name:variant.name,price:variant.price,available_qte:variant.available_qte})):[]});
  }
  if(page===1){
   const last=Number(data.pagination?.last_page);
   if(Number.isInteger(last)&&last>=1){if(last>150)throw new Error('Catalogue exceeds verified import limit');lastPage=last;}
   else if(data.data.length>=100)throw new Error('Missing supplier pagination');
  }
 }
 const published=validateCatalogue(normaliseShipper(rows,content as SupplierContent[]));
 if(rows.length&&!published.length)throw new Error('No verified products in supplier snapshot');
 return rows;
}
// Next's data cache refuses entries over 2 MB and the full catalogue is ~3 MB as JSON, so it is stored gzipped (a few hundred KB).
const readSnapshot=unstable_cache(async()=>{
 if(Date.now()<coolDownUntil)throw new Error('Supplier refresh cooling down');
 try{return gzipSync(JSON.stringify(await fetchSnapshot())).toString('base64');}
 catch(error){
  const retry=error instanceof Error?Number(/retry after (\d+)/.exec(error.message)?.[1]):NaN;
  coolDownUntil=Date.now()+Math.min(MAX_COOL_DOWN_MS,Math.max(COOL_DOWN_MS,Number.isFinite(retry)?retry*1000:0));
  throw error;
 }
},['tunisia-shipper-complete-snapshot-v6'],{revalidate:1800,tags:['tunisia-shipper-catalogue']});
// The v4 entry above is kept only as a fallback: its function text is its cache key, so it still holds the last complete snapshot
// until the v5 entry has filled once. Its result is remembered per instance so it is consulted at most once per COOL_DOWN_MS.
let legacyRows:{at:number;rows:Awaited<ReturnType<typeof legacySnapshot>>}|undefined;
async function legacyFallback(){
 if(legacyRows&&Date.now()-legacyRows.at<COOL_DOWN_MS)return legacyRows.rows;
 const rows=await legacySnapshot();legacyRows={at:Date.now(),rows};return rows;
}


// Share a cold public-catalogue load across concurrent requests in this instance.
// This is one project-wide public catalogue, never request/user-specific state.
let pendingSnapshot:ReturnType<typeof legacyFallback>|undefined;
function sharedSnapshot(){
 if(!pendingSnapshot)pendingSnapshot=readSnapshot().then(packed=>JSON.parse(gunzipSync(Buffer.from(packed,'base64')).toString()) as Awaited<ReturnType<typeof legacyFallback>>).catch(()=>legacyFallback()).finally(()=>{pendingSnapshot=undefined;});
 return pendingSnapshot;
}

export const getLiveProducts=cache(async()=>{
 if(!(process.env.SHIPPER_NETWORK_API_KEY||process.env.TUNISIA_SHIPPER_API_KEY))return [];
 try{const [rows,metadata]=await Promise.all([sharedSnapshot(),supplierContent(content as SupplierContent[])]);return validateCatalogue(normaliseShipper(rows,metadata));}
 catch(error){console.warn('[Tunisia Shipper] snapshot unavailable: '+(error instanceof Error?error.message:'unknown error'));return [];}
});

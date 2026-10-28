import 'server-only';
import {cache} from 'react';
import {unstable_cache} from 'next/cache';
import content from '@/data/shipper-content-index';
import {normaliseShipper,type SupplierContent} from './shipper-normalise';
import {supplierContent} from './private-supplier-content';
import {validateCatalogue} from './catalogue';

// Cache the validated snapshot, never individual pages from different sync runs.
// If a refresh fails, Next retains the last successful whole snapshot.
const readSnapshot=unstable_cache(async()=>{
 const token=process.env.SHIPPER_NETWORK_API_KEY||process.env.TUNISIA_SHIPPER_API_KEY;
 if(!token)throw new Error('Supplier credential unavailable');
 const rows=[];const seen=new Set<string>();let lastPage=1;
 for(let page=1;page<=lastPage;page++){
  // Stay below the provider's read budget, including a complete 12k catalogue.
  if(page>1)await new Promise(resolve=>setTimeout(resolve,650));
  const response=await fetch(`https://server.shipper.network/api/v1/products?per_page=100&page=${page}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000),cache:'no-store'});
  if(!response.ok){
   const retry=response.headers.get('retry-after');
   throw new Error(`Supplier HTTP ${response.status}${response.status===429&&retry?' (retry after '+retry+')':''}`);
  }
  const data=await response.json();if(!Array.isArray(data.data))throw new Error('Invalid supplier catalogue');
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
},['tunisia-shipper-complete-snapshot-v4'],{revalidate:300,tags:['tunisia-shipper-catalogue']});

// Share a cold public-catalogue load across concurrent requests in this instance.
// This is one project-wide public catalogue, never request/user-specific state.
let pendingSnapshot:ReturnType<typeof readSnapshot>|undefined;
function sharedSnapshot(){
 if(!pendingSnapshot)pendingSnapshot=readSnapshot().finally(()=>{pendingSnapshot=undefined;});
 return pendingSnapshot;
}

export const getLiveProducts=cache(async()=>{
 if(!(process.env.SHIPPER_NETWORK_API_KEY||process.env.TUNISIA_SHIPPER_API_KEY))return [];
 try{const [rows,metadata]=await Promise.all([sharedSnapshot(),supplierContent(content as SupplierContent[])]);return validateCatalogue(normaliseShipper(rows,metadata));}
 catch(error){console.warn('[Tunisia Shipper] snapshot unavailable: '+(error instanceof Error?error.message:'unknown error'));return [];}
});

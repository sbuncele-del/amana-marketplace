import 'server-only';
import {cache} from 'react';
import content from '@/data/shipper-content.json';
import {normaliseShipper,type SupplierContent} from './shipper-normalise';
import {validateCatalogue} from './catalogue';
export const getLiveProducts=cache(async()=>{
 const token=process.env.SHIPPER_NETWORK_API_KEY||process.env.TUNISIA_SHIPPER_API_KEY;
 if(!token)return [];
 try{
  const rows=[];
  for(let page=1;page<=20;page++){
   const response=await fetch(`https://server.shipper.network/api/v1/products?per_page=100&page=${page}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000),next:{revalidate:300,tags:['tunisia-shipper-catalogue']}});
   if(!response.ok)throw new Error('Supplier catalogue unavailable');
   const data=await response.json();if(!Array.isArray(data.data))throw new Error('Invalid supplier catalogue');
   rows.push(...data.data);
   const last=Number(data.pagination?.last_page);
   if(Number.isInteger(last)&&last>=page){if(page===last)break;if(last>20)throw new Error('Catalogue exceeds verified import limit');}
   else if(data.data.length<100)break;
   else throw new Error('Missing supplier pagination');
  }
  return validateCatalogue(normaliseShipper(rows,content as SupplierContent[]));
 }catch{console.warn('[Tunisia Shipper] catalogue temporarily unavailable; products withheld.');return [];}
});

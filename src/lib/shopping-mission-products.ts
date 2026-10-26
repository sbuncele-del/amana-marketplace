import 'server-only';
import {cache} from 'react';
import {getCatalogueProduct,getCatalogueSnapshot} from '@/lib/catalogue';
import {getHomepageMerchandising} from '@/lib/homepage-merchandising-store';
import {missionCandidates,missionWindow,type ShoppingMission} from '@/lib/shopping-missions';
import type {CatalogueCardData} from '@/components/shop/catalogue-card';

const currentProduct=cache(async(slug:string)=>{
 for(let attempt=0;attempt<2;attempt++){
  try{return await getCatalogueProduct(slug,false,true,'ZA');}
  catch(error){
   const message=error instanceof Error?error.message:'Unknown refresh failure';
   const transient=/\((429|500|502|503|504)\)|timeout|aborted/i.test(message);
   if(!transient||attempt===1){console.warn('[shopping] Could not refresh product',slug,message);return null;}
   await new Promise(resolve=>setTimeout(resolve,700+(slug.length%5)*100));
  }
 }
 return null;
});
export async function shoppingMissionProducts(mission:ShoppingMission,group?:string,maxPrice?:number,page=1){
 const demand=await getHomepageMerchandising();
 const pools=missionCandidates(mission,getCatalogueSnapshot(),group,demand?.products.map(p=>p.slug)||[],maxPrice);
 // Twelve candidates per group and page; every candidate has a browsable page.
 const window=missionWindow(pools,page);
 const slugs=[...new Set(window.products.map(p=>p.slug))];
 const checked=new Map<string,Awaited<ReturnType<typeof currentProduct>>>();
 for(let offset=0;offset<slugs.length;offset+=4){
  const batch=slugs.slice(offset,offset+4);
  const values=await Promise.all(batch.map(currentProduct));
  batch.forEach((slug,i)=>checked.set(slug,values[i]));
 }
 const used=new Set<string>();
 const rows=pools.map(pool=>{
  const products:CatalogueCardData[]=[];
  for(const item of pool.products.slice((page-1)*12,page*12)){
   const p=checked.get(item.slug);
   if(!p||used.has(p.slug))continue;
   const variant=p.variants.filter(v=>v.supplierAvailable&&Number.isFinite(v.price)&&v.price>0&&(!maxPrice||v.price<=maxPrice)).sort((a,b)=>a.price-b.price)[0];
   const image=variant?.image||p.images[0];
   if(!variant||!image)continue;
   products.push({id:p.id,slug:p.slug,name:p.name,images:[image],price:variant.price,currency:p.currency,supplierAvailable:true,category:p.category});
   used.add(p.slug);

  }
  return {group:pool.group,products};
 });
 return {rows,hasNext:window.hasNext,totalPages:window.totalPages};
}

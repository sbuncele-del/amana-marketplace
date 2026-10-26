import 'server-only';
import {cache} from 'react';
import {getCatalogueProduct,getCatalogueSnapshot} from '@/lib/catalogue';
import {getHomepageMerchandising} from '@/lib/homepage-merchandising-store';
import {missionCandidates,type ShoppingMission} from '@/lib/shopping-missions';
import type {CatalogueCardData} from '@/components/shop/catalogue-card';

const currentProduct=cache((slug:string)=>getCatalogueProduct(slug,false,true,'ZA').catch(()=>null));
export async function shoppingMissionProducts(mission:ShoppingMission,group?:string,maxPrice?:number){
 const demand=await getHomepageMerchandising();
 const pools=missionCandidates(mission,getCatalogueSnapshot(),group,demand?.products.map(p=>p.slug)||[]);
 // Round-robin the matching groups. Never fetch the whole 10k-item catalogue.
 const slugs=[...new Set(Array.from({length:12},(_,i)=>pools.flatMap(p=>p.products[i]?[p.products[i].slug]:[])).flat())].slice(0,48);
 const checked=new Map<string,Awaited<ReturnType<typeof currentProduct>>>();
 for(let offset=0;offset<slugs.length;offset+=8){
  const batch=slugs.slice(offset,offset+8);
  const values=await Promise.all(batch.map(currentProduct));
  batch.forEach((slug,i)=>checked.set(slug,values[i]));
 }
 const used=new Set<string>();
 return pools.map(pool=>{
  const products:CatalogueCardData[]=[];
  for(const item of pool.products){
   const p=checked.get(item.slug);
   if(!p||used.has(p.slug))continue;
   const variant=p.variants.filter(v=>v.supplierAvailable&&Number.isFinite(v.price)&&v.price>0&&(!maxPrice||v.price<=maxPrice)).sort((a,b)=>a.price-b.price)[0];
   const image=variant?.image||p.images[0];
   if(!variant||!image)continue;
   products.push({id:p.id,slug:p.slug,name:p.name,images:[image],price:variant.price,currency:p.currency,supplierAvailable:true,category:p.category});
   used.add(p.slug);
   if(products.length===5)break;
  }
  return {group:pool.group,products};
 });
}

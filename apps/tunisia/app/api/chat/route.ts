import {readCareRetailIndex,publishCareRetailIndex} from '@/lib/care-retail-index';
import {marketChat} from '../../../../../packages/storefront/market-chat-handler';
import {careSearchScore,careBudget} from '../../../../../packages/storefront/care-search';
import {getLiveProducts} from '@/lib/shipper-catalogue';
import {groupProducts} from '@/lib/product-groups';
export const maxDuration=45;
export async function POST(request:Request){return marketChat(request,{country:'Tunisia',basePath:'/tunisia',context:async(messages,locale,pathname)=>{
 const query=messages.filter(m=>m.role==='user').slice(-3).map(m=>m.content).join(' '),budget=careBudget(query);
 const published=await readCareRetailIndex();
 const catalogue=published.length?published:await getLiveProducts();
 if(!published.length&&catalogue.length)await publishCareRetailIndex(catalogue);
 const groups=groupProducts(catalogue);
 return groups.map(p=>({p,score:careSearchScore(query,Object.values(p.title).join(' '))+(pathname.endsWith('/product/'+p.slug)?100:0)})).filter(({p,score})=>score>0&&(!budget||p.priceMillimes/1000<=budget)).sort((a,b)=>b.score-a.score||a.p.priceMillimes-b.p.priceMillimes).slice(0,5).map(({p})=>({name:p.title[locale],href:`/${locale}/product/${p.slug}`,price:p.priceMillimes/1000,available:p.stock>0,hasOptions:p.variants.length>1,description:(p.variants[0]?.description?.[locale]||'').slice(0,500),variants:p.variants.slice(0,12).map(v=>({option:v.optionLabel||v.title[locale],price:v.priceMillimes/1000,available:v.stock>0}))}));
 }});}

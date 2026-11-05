import {getLiveProducts} from '@/lib/shipper-catalogue';
import {buildMerchantFeed} from '@/lib/merchant-feed';
import type {StoreProduct} from '@/lib/catalogue';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
 try{
  const products:StoreProduct[]=await getLiveProducts().catch(()=>[]);
  const {xml,count}=buildMerchantFeed(products);
  if(!count)throw new Error('Published catalogue unavailable');
  return new Response(xml,{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400','X-Robots-Tag':'noindex','X-Product-Count':String(count)}});
 }catch{
  return new Response('Product feed temporarily unavailable. Please retry later.',{status:503,headers:{'Cache-Control':'no-store','Retry-After':'300'}});
 }
}

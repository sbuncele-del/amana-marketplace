import {readCareRetailIndex} from '@/lib/care-retail-index';
import {marketSitemap} from '../../../../packages/storefront/market-sitemap';
export const dynamic='force-dynamic';
export async function GET(){
 const products=await readCareRetailIndex();
 // Never publish/cache a misleading empty sitemap during a database outage.
 if(!products.length)return new Response('Published catalogue temporarily unavailable',{status:503,headers:{'Retry-After':'300','Cache-Control':'no-store'}});
 const xml=marketSitemap('tunisia',['','shop','collections','help','company-information','returns','privacy','terms','cookies'],products);
 return new Response(xml,{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'}});
}

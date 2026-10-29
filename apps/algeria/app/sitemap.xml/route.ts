import {products} from '@/lib/catalogue';
import {marketSitemap} from '../../../../packages/storefront/market-sitemap';
export const revalidate=3600;
export function GET(){
 const xml=marketSitemap('algeria',['','shop','help','company-information','returns'],products);
 return new Response(xml,{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300, s-maxage=3600'}});
}

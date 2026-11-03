import {getSitemapEntries} from '@/lib/sitemap-entries';
import {SITEMAP_PRODUCTS_PER_FILE,marketSitemapIndex} from '../../../../packages/storefront/market-sitemap';
export const dynamic='force-dynamic';
// Index of sitemap files: static pages and categories, then products in chunks.
export async function GET(){
 const entries=await getSitemapEntries();
 // Never publish/cache a misleading empty sitemap during a database outage.
 if(!entries?.products.length)return new Response('Published catalogue temporarily unavailable',{status:503,headers:{'Retry-After':'300','Cache-Control':'no-store'}});
 const chunks=Math.ceil(entries.products.length/SITEMAP_PRODUCTS_PER_FILE);
 const files=['pages.xml',...Array.from({length:chunks},(_,i)=>`products-${i+1}.xml`)];
 return new Response(marketSitemapIndex('tunisia',files),{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'}});
}

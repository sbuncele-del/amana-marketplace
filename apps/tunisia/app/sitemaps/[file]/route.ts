import {STATIC_PAGES,getSitemapEntries} from '@/lib/sitemap-entries';
import {SITEMAP_PRODUCTS_PER_FILE,marketSitemapUrlset} from '../../../../../packages/storefront/market-sitemap';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{file:string}>}){
 const {file}=await params;
 const entries=await getSitemapEntries();
 if(!entries?.products.length)return new Response('Published catalogue temporarily unavailable',{status:503,headers:{'Retry-After':'300','Cache-Control':'no-store'}});
 let paths:string[];
 if(file==='pages.xml')paths=[...STATIC_PAGES,...entries.categories.map(c=>'category/'+c)];
 else{
  const n=Number(file.match(/^products-(\d{1,3})\.xml$/)?.[1]);
  const slice=Number.isInteger(n)&&n>=1?entries.products.slice((n-1)*SITEMAP_PRODUCTS_PER_FILE,n*SITEMAP_PRODUCTS_PER_FILE):[];
  if(!slice.length)return new Response('Not found',{status:404});
  paths=slice.map(s=>'product/'+s);
 }
 return new Response(marketSitemapUrlset('tunisia',paths),{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'}});
}

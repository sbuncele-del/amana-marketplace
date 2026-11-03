import {unstable_cache} from 'next/cache';
import {getLiveProducts} from './shipper-catalogue';
import {readCareRetailIndex} from './care-retail-index';
import {publishedCategories} from './category-pages';
import type {StoreProduct} from './catalogue';
export const STATIC_PAGES=['','shop','collections','help','company-information','returns','privacy','terms','cookies'];
export type SitemapEntries={categories:string[];products:string[]};
function entriesFrom(products:StoreProduct[]):SitemapEntries{
 const slugs=new Set<string>();
 for(const p of products)if(p.active!==false)slugs.add(p.groupSlug||p.slug);
 return {categories:publishedCategories(products).map(c=>c.slug),products:[...slugs].sort()};
}
// The last successful list is kept for a day: if Shipper throttles us, an older sitemap beats an error or an empty one.
const fromLive=unstable_cache(async()=>{
 const products=await getLiveProducts();
 if(!products.length)throw new Error('Live catalogue unavailable');
 return entriesFrom(products);
},['tunisia-sitemap-entries-v1'],{revalidate:3600,tags:['tunisia-shipper-catalogue']});
export async function getSitemapEntries():Promise<SitemapEntries|null>{
 try{return await fromLive();}catch{
  const stored=await readCareRetailIndex();
  return stored.length?entriesFrom(stored):null;
 }
}

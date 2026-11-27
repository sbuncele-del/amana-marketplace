import {productRows,matchesCategory} from './storefront-copy';
import type {ProductGroup} from './product-groups';
export function openingProducts(groups:ProductGroup[],prioritySlugs:string[]){
 const available=groups.filter(g=>g.stock>0&&g.image&&g.priceMillimes>0);
 const bySlug=new Map(available.map(g=>[g.slug,g]));
 const ranked=prioritySlugs.flatMap(slug=>{
  const product=bySlug.get(slug);
  return product?[product]:[];
 });
 const localPicks=productRows.map(row=>available.filter(g=>matchesCategory(g,row.key)).slice(0,6));
 const fallback=Array.from({length:6},(_,index)=>localPicks.flatMap(row=>row.slice(index,index+1))).flat();
 return [...new Set([...ranked,...fallback,...available])].slice(0,Math.max(ranked.length,6));
}

export function homeGroups(groups:ProductGroup[],prioritySlugs:string[]=[]):ProductGroup[]{
 const stocked=groups.filter(g=>g.stock>0),keep=new Set<string>(openingProducts(groups,prioritySlugs).map(g=>g.id));
 for(const g of stocked.filter(g=>g.priceMillimes<50000).slice(0,6))keep.add(g.id);
 for(const row of productRows)for(const g of stocked.filter(g=>matchesCategory(g,row.key)).slice(0,6))keep.add(g.id);
 return groups.filter(g=>keep.has(g.id));
}

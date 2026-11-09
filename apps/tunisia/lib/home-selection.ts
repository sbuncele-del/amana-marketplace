// The home page shows a handful of products (a value row and one row per theme), not the catalogue.
// Selection mirrors StorefrontHome exactly (stocked, in catalogue order, first six per row), so the page renders the same products from this subset.
import {productRows,matchesCategory} from './storefront-copy';
import type {ProductGroup} from './product-groups';
export function homeGroups(groups:ProductGroup[],prioritySlugs:string[]=[]):ProductGroup[]{
 const stocked=groups.filter(g=>g.stock>0),keep=new Set<string>(groups.filter(g=>prioritySlugs.includes(g.slug)&&g.stock>0).map(g=>g.id));
 for(const g of stocked.filter(g=>g.priceMillimes<50000).slice(0,6))keep.add(g.id);
 for(const row of productRows)for(const g of stocked.filter(g=>matchesCategory(g,row.key)).slice(0,6))keep.add(g.id);
 return groups.filter(g=>keep.has(g.id));
}

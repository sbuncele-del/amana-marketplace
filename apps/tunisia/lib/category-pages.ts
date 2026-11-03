// Crawlable category pages: /{locale}/category/{department}. Departments come from the shared list; only those with enough Tunisian products are published.
import {storefrontDepartments} from '../../../packages/storefront/departments';
import {belongsToDepartment} from './catalogue-browse';
import {groupProducts,type ProductGroup} from './product-groups';
import type {StoreProduct} from './catalogue';
export const CATEGORY_PAGE_SIZE=24;
export const MIN_CATEGORY_PRODUCTS=8;
export type CategoryLink={slug:string;name:string;count:number};
export const isDepartment=(slug:string)=>storefrontDepartments.some(d=>d.slug===slug);
// In-stock first so the first page shows buyable products; ties by slug keep paging stable.
export function categoryGroups(groups:ProductGroup[],slug:string){
 return groups.filter(g=>belongsToDepartment(g,slug)).sort((a,b)=>Number(b.stock>0)-Number(a.stock>0)||a.slug.localeCompare(b.slug));
}
// Counting 30+ departments over thousands of products is the expensive part, so keep it for a few minutes per instance.
let memo:{at:number;size:number;links:CategoryLink[]}|undefined;
export function publishedCategories(products:StoreProduct[]):CategoryLink[]{
 if(memo&&Date.now()-memo.at<600000&&memo.size===products.length)return memo.links;
 const groups=groupProducts(products);
 const links=storefrontDepartments.map(d=>({slug:d.slug,name:d.name,count:groups.filter(g=>belongsToDepartment(g,d.slug)).length})).filter(c=>c.count>=MIN_CATEGORY_PRODUCTS);
 memo={at:Date.now(),size:products.length,links};
 return links;
}

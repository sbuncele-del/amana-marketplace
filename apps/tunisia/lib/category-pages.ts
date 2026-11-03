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
let memo:{at:number;size:number;counts:Record<string,number>}|undefined;
export function departmentCounts(products:StoreProduct[]):Record<string,number>{
 if(memo&&Date.now()-memo.at<600000&&memo.size===products.length)return memo.counts;
 const groups=groupProducts(products),counts:Record<string,number>={};
 for(const d of storefrontDepartments)counts[d.slug]=groups.filter(g=>belongsToDepartment(g,d.slug)).length;
 memo={at:Date.now(),size:products.length,counts};
 return counts;
}
export function publishedCategories(products:StoreProduct[]):CategoryLink[]{
 const counts=departmentCounts(products);
 return storefrontDepartments.map(d=>({slug:d.slug,name:d.name,count:counts[d.slug]})).filter(c=>c.count>=MIN_CATEGORY_PRODUCTS);
}

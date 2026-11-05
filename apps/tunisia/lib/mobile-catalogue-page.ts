import type {StoreProduct} from './catalogue';
import {primaryDepartment} from './catalogue-browse';
import {groupProducts} from './product-groups';

const PAGE_SIZE=24;
const indexes=new WeakMap<StoreProduct[], Map<string, ReturnType<typeof groupProducts>>>();

export function mobileCataloguePage(catalogue:StoreProduct[],category='',page=1){
 let index=indexes.get(catalogue);
 if(!index){
  index=new Map();
  const available=groupProducts(catalogue).filter(product=>product.stock>0&&product.image&&product.priceMillimes>0)
   .map(product=>({...product,variants:[]}));
  index.set('',available);
  for(const product of available){
   const department=primaryDepartment(product);
   if(!index.has(department))index.set(department,[]);
   index.get(department)!.push(product);
  }
  indexes.set(catalogue,index);
 }
 const products=index.get(category)??[];
 return {products:products.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),hasNextPage:page*PAGE_SIZE<products.length};
}

export type MobileCataloguePage=ReturnType<typeof mobileCataloguePage>;

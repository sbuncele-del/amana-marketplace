import type {StoreProduct} from './catalogue';
export type ProductGroup={id:string;slug:string;title:StoreProduct['title'];image:string;category:string;variants:StoreProduct[];priceMillimes:number;stock:number};
export function groupProducts(products:StoreProduct[]):ProductGroup[]{
 const groups=new Map<string,ProductGroup>();
 for(const p of products){
  const id=p.groupId||p.id;
  let group=groups.get(id);
  if(!group){group={id,slug:p.groupSlug||p.slug,title:p.groupTitle||p.title,image:p.image,category:p.category,variants:[],priceMillimes:p.priceMillimes,stock:0};groups.set(id,group);}
  group.variants.push(p);group.stock+=p.stock;
 }
 for(const group of groups.values()){
  const available=group.variants.filter(p=>p.stock>0);
  group.priceMillimes=Math.min(...(available.length?available:group.variants).map(p=>p.priceMillimes));
 }
 return [...groups.values()];
}

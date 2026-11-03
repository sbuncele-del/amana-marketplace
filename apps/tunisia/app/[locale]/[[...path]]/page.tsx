import {after} from 'next/server';
import {publishCareRetailIndex} from '@/lib/care-retail-index';
import {notFound} from 'next/navigation';
import Store from '@/components/store';
import {locales,type Locale,type StoreProduct} from '@/lib/catalogue';
import {getStorefrontPreviewProducts} from '@/lib/storefront-preview';
import {getLiveProducts} from '@/lib/shipper-catalogue';
import {codConfig} from '@/lib/orders/config';
import {groupProducts} from '@/lib/product-groups';
import {recommend} from '@/lib/recommendations';
import {CATEGORY_PAGE_SIZE,categoryGroups,departmentCounts,isDepartment,publishedCategories} from '@/lib/category-pages';
import {storefrontDepartments} from '../../../../../packages/storefront/departments';
import {SHOP_PAGE_SIZE,browseGroups,parseShopParams} from '@/lib/catalogue-browse';
import {homeGroups} from '@/lib/home-selection';
import {storefrontTranslator} from '@/lib/storefront-locale';
import type {Metadata} from 'next';
const origin='https://plentovo.com/tunisia';
// Indexing stays off until TUNISIA_INDEXING=true. Even then, cart, checkout and tracking are never indexed.
export async function generateMetadata({params,searchParams}:{params:Promise<{locale:string;path?:string[]}>;searchParams:Promise<{page?:string}>}):Promise<Metadata>{
 const {locale,path=[]}=await params;
 const route=path.join('/'),private_=['cart','checkout','track','account'].includes(route);
 const suffix=route?'/'+route:'';
 const product=path[0]==='product'&&path.length===2?(await getLiveProducts().catch(()=>[])).find(p=>p.slug===path[1]||p.groupSlug===path[1]):undefined;
 const loc=(locale==='fr'||locale==='ar'?locale:'en') as Locale;
 const text=product?(product.groupTitle?.[loc]||product.title[loc]):'';
 const summary=product?.description?.[loc]?.replace(/\s+/g,' ').trim().slice(0,155)||'';
 const dept=path[0]==='category'&&path.length===2?storefrontDepartments.find(d=>d.slug===path[1]):undefined;
 const pageNo=dept?Math.max(1,Math.floor(Number((await searchParams).page))||1):1;
 const deptName=dept?storefrontTranslator(loc)(dept.name):'';
 const deptDescription={en:`Shop ${deptName} at Plentovo Tunisia: delivered across Tunisia, pay on delivery.`,fr:`Découvrez ${deptName} chez Plentovo Tunisie : livraison partout en Tunisie, paiement à la livraison.`,ar:`تسوق ${deptName} من بلنتوفو تونس: التوصيل إلى كل أنحاء تونس والدفع عند الاستلام.`}[loc];
 return {
  ...(dept?{title:`${deptName}${pageNo>1?` (${pageNo})`:''} | Plentovo Tunisia`,description:deptDescription}:{}),
  ...(product?{title:`${text} | Plentovo Tunisia`,description:summary||`${text} — delivered in Tunisia, pay on delivery.`,openGraph:{title:text,description:summary||undefined,type:'website',url:`${origin}/${locale}${suffix}`,images:[product.image]},twitter:{card:'summary_large_image' as const,title:text,images:[product.image]}}:{}),
  ...(private_?{robots:{index:false,follow:false}}:{}),
  alternates:{canonical:`${origin}/${locale}${suffix}${pageNo>1?'?page='+pageNo:''}`,languages:{en:`${origin}/en${suffix}`,fr:`${origin}/fr${suffix}`,ar:`${origin}/ar${suffix}`,'x-default':`${origin}/en${suffix}`}},
 };
}
export default async function Page({params,searchParams}:{params:Promise<{locale:string;path?:string[]}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {locale,path=[]}=await params;
 if(!locales.includes(locale as Locale))notFound();
 const previewOnly=process.env.VERCEL_ENV==='preview'&&!process.env.SHIPPER_NETWORK_API_KEY&&!process.env.TUNISIA_SHIPPER_API_KEY;
 const informationOnly=['company-information','returns'].includes(path.join('/'));
 const products=informationOnly?[]:previewOnly?await getStorefrontPreviewProducts():await getLiveProducts();
 if(!previewOnly&&products.length)after(()=>publishCareRetailIndex(products));
 const route=path.join('/');
 if(!['','shop','cart','checkout','track','account','help','collections','privacy','terms','cookies','company-information','returns'].includes(route)&&!(path[0]==='product'&&path.length===2&&products.some(p=>p.slug===path[1]||p.groupSlug===path[1]))&&!(path[0]==='category'&&path.length===2&&isDepartment(path[1])))notFound();
 const search=await searchParams;
 const one=(key:string)=>{const v=search[key];return Array.isArray(v)?v[0]:v;};
 const query=one('q')||'';
 const maxPrice=Number(one('maxPrice'))>0?Number(one('maxPrice')):0;
 // List/cart pages need summaries; only the selected product needs its full copy/gallery.
 const selected=products.find(p=>route===`product/${p.slug}`||route===`product/${p.groupSlug}`);
 // A product page needs only its own options and its "You may also like" picks, not all ~6,000 products (the payload was ~5 MB).
 // The picks come from the same recommend() the page uses, so the result is identical.
 let scope:StoreProduct[]=products;
 if(selected){const groups=groupProducts(products),viewedId=selected.groupId||selected.id,viewed=groups.find(g=>g.id===viewedId);const keep=new Set([viewedId,...(viewed?recommend(viewed,groups).map(g=>g.id):[])]);scope=products.filter(p=>keep.has(p.groupId||p.id));}
 // A category page is one page of 24 product cards plus links to the other categories, never the whole catalogue.
 let category;
 if(path[0]==='category'&&path.length===2){
  const links=publishedCategories(products),slug=path[1];
  if(!links.some(l=>l.slug===slug))notFound();
  const all=categoryGroups(groupProducts(products),slug),pages=Math.max(1,Math.ceil(all.length/CATEGORY_PAGE_SIZE)),page=Math.min(pages,Math.max(1,Math.floor(Number(one('page')))||1));
  const slice=all.slice((page-1)*CATEGORY_PAGE_SIZE,page*CATEGORY_PAGE_SIZE),keep=new Set(slice.map(g=>g.id));
  scope=products.filter(p=>keep.has(p.groupId||p.id));
  category={slug,page,pages,total:all.length,ids:slice.map(g=>g.id),links};
 }
 // The shop sends one filtered page of 25 products (the browser used to filter all ~6,000 itself); the home page sends only the ~40 it displays.
 let shop;
 if(route==='shop'||(query&&!selected&&!category)){
  const f=parseShopParams(one),all=browseGroups(groupProducts(products),{category:f.activeCategory,search:f.search,available:f.available,min:f.min,max:f.max,sort:f.sort});
  const totalPages=Math.max(1,Math.ceil(all.length/SHOP_PAGE_SIZE)),page=Math.min(totalPages,Number.isSafeInteger(f.page)&&f.page>0?f.page:1);
  const slice=all.slice((page-1)*SHOP_PAGE_SIZE,page*SHOP_PAGE_SIZE);
  scope=slice.flatMap(g=>g.variants);
  shop={total:all.length,totalPages,page,counts:departmentCounts(products)};
 }else if(route===''&&!query){
  const keep=new Set(homeGroups(groupProducts(products)).map(g=>g.id));scope=products.filter(p=>keep.has(p.groupId||p.id));
 }else if(route==='collections'&&!query)scope=[];
 const publicProducts=scope.map(product=>{
  if(selected&&(product.groupId||product.id)===(selected.groupId||selected.id))return product;
  const {description,images,...summary}=product;
  return summary;
 });
 const ld=selected?{'@context':'https://schema.org','@type':'Product',name:selected.groupTitle?.[locale as Locale]||selected.title[locale as Locale],image:[selected.image,...(selected.images||[])].slice(0,6),description:(selected.description?.[locale as Locale]||'').replace(/\s+/g,' ').trim().slice(0,500)||undefined,sku:selected.id,offers:{'@type':'Offer',url:`${origin}/${locale}/product/${selected.groupSlug||selected.slug}`,priceCurrency:'TND',price:(selected.priceMillimes/1000).toFixed(3),availability:selected.stock>0?'https://schema.org/InStock':'https://schema.org/OutOfStock'}}:null;
 return <>{ld&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/>}<Store shop={shop} category={category} partial={!!selected||!!category||!!shop||(route===''&&!query)||(route==='collections'&&!query)} initialQuery={query} locale={locale as Locale} route={route} products={publicProducts} maxPrice={maxPrice} ordersOpen={codConfig(process.env)!==null}/></>;
}

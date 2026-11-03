import {after} from 'next/server';
import {publishCareRetailIndex} from '@/lib/care-retail-index';
import {notFound} from 'next/navigation';
import Store from '@/components/store';
import {locales,type Locale} from '@/lib/catalogue';
import {getStorefrontPreviewProducts} from '@/lib/storefront-preview';
import {getLiveProducts} from '@/lib/shipper-catalogue';
import {codConfig} from '@/lib/orders/config';
import {groupProducts} from '@/lib/product-groups';
import {recommend} from '@/lib/recommendations';
import type {Metadata} from 'next';
const origin='https://plentovo.com/tunisia';
// Indexing stays off until TUNISIA_INDEXING=true. Even then, cart, checkout and tracking are never indexed.
export async function generateMetadata({params}:{params:Promise<{locale:string;path?:string[]}>}):Promise<Metadata>{
 const {locale,path=[]}=await params;
 const route=path.join('/'),private_=['cart','checkout','track','account'].includes(route);
 const suffix=route?'/'+route:'';
 const product=path[0]==='product'&&path.length===2?(await getLiveProducts().catch(()=>[])).find(p=>p.slug===path[1]||p.groupSlug===path[1]):undefined;
 const loc=(locale==='fr'||locale==='ar'?locale:'en') as Locale;
 const text=product?(product.groupTitle?.[loc]||product.title[loc]):'';
 const summary=product?.description?.[loc]?.replace(/\s+/g,' ').trim().slice(0,155)||'';
 return {
  ...(product?{title:`${text} | Plentovo Tunisia`,description:summary||`${text} — delivered in Tunisia, pay on delivery.`,openGraph:{title:text,description:summary||undefined,type:'website',url:`${origin}/${locale}${suffix}`,images:[product.image]},twitter:{card:'summary_large_image' as const,title:text,images:[product.image]}}:{}),
  ...(private_?{robots:{index:false,follow:false}}:{}),
  alternates:{canonical:`${origin}/${locale}${suffix}`,languages:{en:`${origin}/en${suffix}`,fr:`${origin}/fr${suffix}`,ar:`${origin}/ar${suffix}`,'x-default':`${origin}/en${suffix}`}},
 };
}
export default async function Page({params,searchParams}:{params:Promise<{locale:string;path?:string[]}>;searchParams:Promise<{q?:string;maxPrice?:string}>}){
 const {locale,path=[]}=await params;
 if(!locales.includes(locale as Locale))notFound();
 const previewOnly=process.env.VERCEL_ENV==='preview'&&!process.env.SHIPPER_NETWORK_API_KEY&&!process.env.TUNISIA_SHIPPER_API_KEY;
 const informationOnly=['company-information','returns'].includes(path.join('/'));
 const products=informationOnly?[]:previewOnly?await getStorefrontPreviewProducts():await getLiveProducts();
 if(!previewOnly&&products.length)after(()=>publishCareRetailIndex(products));
 const route=path.join('/');
 if(!['','shop','cart','checkout','track','account','help','collections','privacy','terms','cookies','company-information','returns'].includes(route)&&!(path[0]==='product'&&path.length===2&&products.some(p=>p.slug===path[1]||p.groupSlug===path[1])))notFound();
 const search=await searchParams;
 const query=search.q||'';
 const maxPrice=Number(search.maxPrice)>0?Number(search.maxPrice):0;
 // List/cart pages need summaries; only the selected product needs its full copy/gallery.
 const selected=products.find(p=>route===`product/${p.slug}`||route===`product/${p.groupSlug}`);
 // A product page needs only its own options and its "You may also like" picks, not all ~6,000 products (the payload was ~5 MB).
 // The picks come from the same recommend() the page uses, so the result is identical.
 let scope=products;
 if(selected){const groups=groupProducts(products),viewedId=selected.groupId||selected.id,viewed=groups.find(g=>g.id===viewedId);const keep=new Set([viewedId,...(viewed?recommend(viewed,groups).map(g=>g.id):[])]);scope=products.filter(p=>keep.has(p.groupId||p.id));}
 const publicProducts=scope.map(product=>{
  if(selected&&(product.groupId||product.id)===(selected.groupId||selected.id))return product;
  const {description,images,...summary}=product;
  return summary;
 });
 const ld=selected?{'@context':'https://schema.org','@type':'Product',name:selected.groupTitle?.[locale as Locale]||selected.title[locale as Locale],image:[selected.image,...(selected.images||[])].slice(0,6),description:(selected.description?.[locale as Locale]||'').replace(/\s+/g,' ').trim().slice(0,500)||undefined,sku:selected.id,offers:{'@type':'Offer',url:`${origin}/${locale}/product/${selected.groupSlug||selected.slug}`,priceCurrency:'TND',price:(selected.priceMillimes/1000).toFixed(3),availability:selected.stock>0?'https://schema.org/InStock':'https://schema.org/OutOfStock'}}:null;
 return <>{ld&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(ld).replace(/</g,'\\u003c')}}/>}<Store partial={!!selected} initialQuery={query} locale={locale as Locale} route={route} products={publicProducts} maxPrice={maxPrice} ordersOpen={codConfig(process.env)!==null}/></>;
}

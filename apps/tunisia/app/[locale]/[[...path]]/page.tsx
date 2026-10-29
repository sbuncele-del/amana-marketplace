import {notFound} from 'next/navigation';
import Store from '@/components/store';
import {locales,type Locale} from '@/lib/catalogue';
import {getStorefrontPreviewProducts} from '@/lib/storefront-preview';
import {getLiveProducts} from '@/lib/shipper-catalogue';
export default async function Page({params,searchParams}:{params:Promise<{locale:string;path?:string[]}>;searchParams:Promise<{q?:string;maxPrice?:string}>}){
 const {locale,path=[]}=await params;
 if(!locales.includes(locale as Locale))notFound();
 const previewOnly=process.env.VERCEL_ENV==='preview'&&!process.env.SHIPPER_NETWORK_API_KEY&&!process.env.TUNISIA_SHIPPER_API_KEY;
 const products=previewOnly?await getStorefrontPreviewProducts():await getLiveProducts();
 const route=path.join('/');
 if(!['','shop','cart','checkout','track','help','collections','privacy','terms','cookies'].includes(route)&&!(path[0]==='product'&&path.length===2&&products.some(p=>p.slug===path[1]||p.groupSlug===path[1])))notFound();
 const search=await searchParams;
 const query=search.q||'';
 const maxPrice=Number(search.maxPrice)>0?Number(search.maxPrice):0;
 // List/cart pages need summaries; only the selected product needs its full copy/gallery.
 const selected=products.find(p=>route===`product/${p.slug}`||route===`product/${p.groupSlug}`);
 const publicProducts=products.map(product=>{
  if(selected&&(product.groupId||product.id)===(selected.groupId||selected.id))return product;
  const {description,images,...summary}=product;
  return summary;
 });
 return <Store initialQuery={query} locale={locale as Locale} route={route} products={publicProducts} maxPrice={maxPrice}/>;
}

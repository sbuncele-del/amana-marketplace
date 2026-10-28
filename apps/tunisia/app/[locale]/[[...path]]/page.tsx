import {notFound} from 'next/navigation';
import Store from '@/components/store';
import {locales,type Locale} from '@/lib/catalogue';
import {getLiveProducts} from '@/lib/shipper-catalogue';
export default async function Page({params,searchParams}:{params:Promise<{locale:string;path?:string[]}>;searchParams:Promise<{q?:string}>}){
 const {locale,path=[]}=await params;
 if(!locales.includes(locale as Locale))notFound();
 const products=await getLiveProducts();
 const route=path.join('/');
 if(!['','shop','cart','checkout','track','help'].includes(route)&&!(path[0]==='product'&&path.length===2&&products.some(p=>p.slug===path[1])))notFound();
 const query=(await searchParams).q||'';
 // List/cart pages need summaries; only the selected product needs its full copy/gallery.
 const publicProducts=products.map(product=>{
  if(route===`product/${product.slug}`)return product;
  const {description,images,...summary}=product;
  return summary;
 });
 return <Store initialQuery={query} locale={locale as Locale} route={route} products={publicProducts}/>;
}

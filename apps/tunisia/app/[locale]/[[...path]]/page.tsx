import {notFound} from 'next/navigation';
import {after} from 'next/server';
import Store from '@/components/store';
import {locales,type Locale} from '@/lib/catalogue';
import {getProduct,listProducts,syncIfStale} from '@/lib/catalogue-source';
import {HOME_SIZE,PAGE_SIZE} from '@/lib/import/read';
export const maxDuration=60;
export default async function Page({params,searchParams}:{params:Promise<{locale:string;path?:string[]}>;searchParams:Promise<{q?:string|string[];page?:string|string[]}>}){
 const {locale,path=[]}=await params;
 if(!locales.includes(locale as Locale))notFound();
 const route=path.join('/');
 const sp=await searchParams;
 const query=(typeof sp.q==='string'?sp.q:'').slice(0,100);
 const pageNumber=Number(typeof sp.page==='string'?sp.page:1)||1;
 const selected=path[0]==='product'&&path.length===2?await getProduct(path[1]):null;
 if(!['','shop','cart','checkout','track','help'].includes(route)&&!selected)notFound();
 // Only the visible page of products is sent to the browser, never the whole catalogue.
 const listing=route==='shop'||query?await listProducts({q:query,locale:locale as Locale,page:pageNumber,size:PAGE_SIZE}):route===''?await listProducts({q:'',locale:locale as Locale,page:1,size:HOME_SIZE}):{items:[],total:0,page:1,pages:1};
 after(syncIfStale);
 return <Store initialQuery={query} locale={locale as Locale} route={route} products={listing.items} selected={selected} pagination={{page:listing.page,pages:listing.pages,total:listing.total}}/>;
}

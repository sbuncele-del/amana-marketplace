'use client';
import {useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import {MobileCampaignCarousel,MobileCampaignShortcuts,type MobileCampaign} from './mobile-campaigns';
export const mobileShoppingCopy={
 en:{all:'For you',categories:'Categories',home:'Home',cart:'Cart',account:'Account',more:'More products',loading:'Loading products…',retry:'Try again',error:'Products could not load.',empty:'No products here yet. Try another category.',assist:'Help',help:'Shopping assistant'},
 fr:{all:'Pour vous',categories:'Catégories',home:'Accueil',cart:'Panier',account:'Compte',more:'Plus de produits',loading:'Chargement des produits…',retry:'Réessayer',error:'Impossible de charger les produits.',empty:'Aucun produit ici. Essayez une autre catégorie.',assist:'Aide',help:'Assistant shopping'},
 ar:{all:'لك',categories:'الفئات',home:'الرئيسية',cart:'السلة',account:'حسابي',more:'المزيد من المنتجات',loading:'جارٍ تحميل المنتجات…',retry:'حاول مجدداً',error:'تعذر تحميل المنتجات.',empty:'لا توجد منتجات هنا. جرّب فئة أخرى.',assist:'مساعدة',help:'مساعد التسوق'},
};
// Repeat gaps of 24, 32, 24 products; pagination batch sizes do not affect placement.
export function mobilePromotionIndex(productCount:number){
 const position=((productCount-1)%80)+1;
 const slot=[24,56,80].indexOf(position);
 return productCount>0&&slot>=0?Math.floor((productCount-1)/80)*3+slot:-1;
}
export type MobilePromotion={title:string;text:string;action:string;href:string};
export type MobileCategory={slug:string;name:string};
export function MobileShoppingFeed<P extends {slug:string}>({categories,load,renderProduct,locale='en',promotions=[],campaigns,market='ZA'}:{categories:MobileCategory[];load:(category:string,page:number,signal:AbortSignal)=>Promise<{products:P[];hasNextPage:boolean}>;renderProduct:(product:P)=>ReactNode;locale?:keyof typeof mobileShoppingCopy;promotions?:MobilePromotion[];campaigns?:(products:P[])=>MobileCampaign[];market?:'ZA'|'TN'}){
 const c=mobileShoppingCopy[locale],[category,setCategory]=useState(''),[products,setProducts]=useState<P[]>([]),[page,setPage]=useState(0),[more,setMore]=useState(true),[busy,setBusy]=useState(true),[error,setError]=useState(false),[active,setActive]=useState(false);
 const sentinel=useRef<HTMLDivElement>(null),request=useRef<AbortController|null>(null),loading=useRef(false);
 useEffect(()=>{const media=window.matchMedia('(max-width: 639px)');const update=()=>setActive(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 const fetchPage=useCallback(async(next:number,replace=false)=>{if(loading.current)return;loading.current=true;setBusy(true);setError(false);const controller=new AbortController();request.current=controller;try{const result=await load(category,next,controller.signal);if(controller.signal.aborted)return;setProducts(old=>[...new Map([...(replace?[]:old),...result.products].map(p=>[p.slug,p])).values()]);setMore(result.hasNextPage);setPage(next);}catch{if(!controller.signal.aborted){setError(true);}}finally{if(request.current===controller){loading.current=false;setBusy(false);}}},[category,load]);
 useEffect(()=>{if(!active)return;request.current?.abort();loading.current=false;setProducts([]);setPage(0);setMore(true);void fetchPage(1,true);return()=>{request.current?.abort();loading.current=false;};},[active,fetchPage]);
 useEffect(()=>{if(!active||!more||busy||error||!page||!sentinel.current||typeof IntersectionObserver==='undefined')return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))void fetchPage(page+1);},{rootMargin:'500px'});observer.observe(sentinel.current);return()=>observer.disconnect();},[active,more,busy,error,page,fetchPage]);
 return <section id="mobile-shopping-content" role="main" tabIndex={-1} className="mobile-shopping" aria-label={c.all}>
  <div className="mobile-category-tabs" role="group" aria-label={c.categories}>{[{slug:'',name:c.all},...categories].map(cat=><button key={cat.slug} type="button" aria-pressed={category===cat.slug} onClick={()=>setCategory(cat.slug)}>{cat.name}</button>)}</div>
  <div className="mobile-product-feed">{products.map((product,index)=>{const slot=mobilePromotionIndex(index+1);const promotion=category===''&&slot>=0?promotions[slot]:undefined;return <div key={product.slug} className="mobile-feed-item">{renderProduct(product)}{category===''&&index===1&&campaigns?<><MobileCampaignCarousel slides={campaigns(products.slice(0,24))} locale={locale}/><MobileCampaignShortcuts market={market} locale={locale}/></>:null}{promotion&&<a className="mobile-feed-promotion" href={promotion.href}><strong>{promotion.title}</strong><span>{promotion.text}</span><b>{promotion.action} →</b></a>}</div>;})}{busy&&!products.length&&Array.from({length:6},(_,i)=><div key={i} className="mobile-product-skeleton" aria-hidden="true"/>)}</div>
  <div ref={sentinel} className="mobile-feed-status" aria-live="polite">{busy&&<p>{c.loading}</p>}{error?<><p>{c.error}</p><button type="button" onClick={()=>void fetchPage(page+1,page===0)}>{c.retry}</button></>:!busy&&more&&page>0?<button type="button" onClick={()=>void fetchPage(page+1)}>{c.more}</button>:!busy&&!products.length&&<p>{c.empty}</p>}</div>
 </section>;
}

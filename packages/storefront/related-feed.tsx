'use client';

import {useEffect,useRef,useState,type ReactNode} from 'react';
import {mobileShoppingCopy} from './mobile-shopping';

type RelatedPage<P>={products:P[];hasNextPage:boolean};

export function RelatedFeed<P extends {slug:string}>({title,endpoint,excluded,select,render,locale='en'}:{
 title:string;
 endpoint:string;
 excluded:string[];
 select:(payload:RelatedPage<P>)=>P[];
 render:(product:P)=>ReactNode;
 locale?:keyof typeof mobileShoppingCopy;
}){
 const [products,setProducts]=useState<P[]>([]);
 const [page,setPage]=useState(1);
 const [more,setMore]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState(false);
 const request=useRef<AbortController|null>(null);
 const sentinel=useRef<HTMLDivElement>(null);
 const copy=mobileShoppingCopy[locale];

 useEffect(()=>()=>{request.current?.abort();request.current=null;},[]);

 async function loadPage(){
  if(request.current||!more)return;
  const controller=new AbortController();
  request.current=controller;
  setBusy(true);
  setError(false);
  try{
   const response=await fetch(endpoint+'&page='+page,{signal:controller.signal});
   if(!response.ok)throw new Error('Related products unavailable');
   const data=await response.json() as RelatedPage<P>;
   const next=select(data).filter(product=>!excluded.includes(product.slug));
   if(controller.signal.aborted)return;
   setProducts(current=>[...new Map([...current,...next].map(product=>[product.slug,product])).values()]);
   setMore(data.hasNextPage);
   setPage(page+1);
  }catch{
   if(!controller.signal.aborted)setError(true);
  }finally{
   if(request.current===controller){
    request.current=null;
    setBusy(false);
   }
  }
 }

 useEffect(()=>{
  if(!more||busy||error||!sentinel.current||typeof IntersectionObserver==='undefined')return;
  const observer=new IntersectionObserver(entries=>{
   if(entries.some(entry=>entry.isIntersecting))void loadPage();
  },{rootMargin:'400px'});
  observer.observe(sentinel.current);
  return()=>observer.disconnect();
 });

 if(!more&&!products.length)return null;
 return <section className="mx-auto max-w-[1400px] px-4 pb-12" aria-label={title}>
  <h2 className="mb-5 text-2xl font-bold tracking-tight">{title}</h2>
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
   {products.map(product=><div key={product.slug}>{render(product)}</div>)}
  </div>
  <div ref={sentinel} className="mt-4" aria-live="polite">
   {busy?<p>{copy.loading}</p>:error?<><p>{copy.error}</p><button type="button" onClick={()=>void loadPage()}>{copy.retry}</button></>:more?<button type="button" onClick={()=>void loadPage()}>{copy.more}</button>:null}
  </div>
 </section>;
}

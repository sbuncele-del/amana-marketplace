'use client';
import {useCallback} from 'react';
import {mobileCampaigns} from '../../../packages/storefront/mobile-campaigns';
import {MobileShoppingFeed} from '../../../packages/storefront/mobile-shopping';
import {CatalogueCard,type CatalogueCardData} from './catalogue-card';
import departments from '@/data/departments.json';
export function MobileShoppingHome(){
 const load=useCallback(async(category:string,page:number,signal:AbortSignal)=>{const q=new URLSearchParams({limit:'24',page:String(page)});if(category)q.set('collection',category);const r=await fetch('/api/catalogue?'+q,{signal});if(!r.ok)throw new Error('Catalogue unavailable');const data=await r.json();let products=data.products as CatalogueCardData[];if(!category&&page===1){try{const recent=JSON.parse(sessionStorage.getItem('plentovo:recent-categories:v1:ZAR')||'[]');if(Array.isArray(recent))products=[...products].sort((a,b)=>Number(recent.includes(b.category.slug))-Number(recent.includes(a.category.slug)));}catch{}}return {products,hasNextPage:Boolean(data.hasNextPage)};},[]);
 return <MobileShoppingFeed campaigns={products=>mobileCampaigns('en','ZA',{
  budget:products.find(p=>p.supplierAvailable&&!p.priceOnRequest&&p.price>0&&p.price<300&&p.images[0])?.images[0],
  kitchen:products.find(p=>p.category.slug==='kitchen-dining'&&p.images[0])?.images[0],
  tech:products.find(p=>p.category.slug==='electronics'&&p.images[0])?.images[0],
 })} promotions={[{title:"Good finds. Your budget.",text:"Find something useful under R300.",action:"Explore under R300",href:"/browse?maxPrice=300"},{title:"Small tech. More possibilities.",text:"Discover everyday electronics.",action:"Explore electronics",href:"/department/electronics"},{title:"Make everyday cooking easier",text:"Useful tools for prep, cooking and serving.",action:"Shop kitchen & dining",href:"/department/kitchen-dining"},{title:"Make room for play",text:"Find their next favourite toy or game.",action:"Shop toys & games",href:"/department/toys-kids-baby"},{title:"A little everyday care",text:"Find essentials for your daily routine.",action:"Shop health & beauty",href:"/department/health-beauty"}]} categories={departments.map(d=>({slug:d.slug,name:d.name}))} load={load} renderProduct={p=><CatalogueCard product={p}/>}/>;
}

'use client';
import {useCallback} from 'react';
import {MobileShoppingFeed} from '../../../packages/storefront/mobile-shopping';
import {CatalogueCard,type CatalogueCardData} from './catalogue-card';
import departments from '@/data/departments.json';
export function MobileShoppingHome(){
 const load=useCallback(async(category:string,page:number,signal:AbortSignal)=>{const q=new URLSearchParams({limit:'24',page:String(page)});if(category)q.set('collection',category);const r=await fetch('/api/catalogue?'+q,{signal});if(!r.ok)throw new Error('Catalogue unavailable');const data=await r.json();let products=data.products as CatalogueCardData[];if(!category&&page===1){try{const recent=JSON.parse(sessionStorage.getItem('plentovo:recent-categories:v1:ZAR')||'[]');if(Array.isArray(recent))products=[...products].sort((a,b)=>Number(recent.includes(b.category.slug))-Number(recent.includes(a.category.slug)));}catch{}}return {products,hasNextPage:Boolean(data.hasNextPage)};},[]);
 return <MobileShoppingFeed categories={departments.map(d=>({slug:d.slug,name:d.name}))} load={load} renderProduct={p=><CatalogueCard product={p}/>}/>;
}

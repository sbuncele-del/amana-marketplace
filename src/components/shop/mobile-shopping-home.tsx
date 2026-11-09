'use client';
import {useCallback} from 'react';
import {mobileOpeningPicks} from '../../../packages/storefront/mobile-opening-picks';
import {mobileCampaigns,mobileFeedCampaigns} from '../../../packages/storefront/mobile-campaigns';
import {MobileShoppingFeed} from '../../../packages/storefront/mobile-shopping';
import {CatalogueCard,type CatalogueCardData} from './catalogue-card';
import departments from '@/data/departments.json';
const favoriteTitle=(p:CatalogueCardData)=>p.name;
export function MobileShoppingHome(){
 const load=useCallback(async(category:string,page:number,signal:AbortSignal)=>{const q=new URLSearchParams({limit:'24',page:String(page),sort:'newest'});if(category)q.set('collection',category);const r=await fetch('/api/catalogue?'+q,{signal});if(!r.ok)throw new Error('Catalogue unavailable');const data=await r.json();let products=(data.products as CatalogueCardData[]).filter(product=>product.supplierAvailable&&!product.priceOnRequest);if(!category&&page===1){try{const recent=JSON.parse(sessionStorage.getItem('plentovo:recent-categories:v1:ZAR')||'[]');if(Array.isArray(recent))products=[...products].sort((a,b)=>Number(recent.includes(b.category.slug))-Number(recent.includes(a.category.slug)));}catch{}}if(!category&&page===1)products=mobileOpeningPicks(products,p=>({title:p.name,category:p.category.slug,available:p.supplierAvailable&&!p.priceOnRequest,image:p.images[0],price:p.price}),300);return {products,hasNextPage:Boolean(data.hasNextPage)};},[]);
 return <MobileShoppingFeed campaigns={()=>mobileCampaigns('en','ZA')} promotions={mobileFeedCampaigns('en','ZA')} categories={departments.map(d=>({slug:d.slug,name:d.name}))} load={load} favoriteTitle={favoriteTitle} renderProduct={(p,favorite)=><CatalogueCard product={p} favorite={favorite}/>}/>;
}

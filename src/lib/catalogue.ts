import 'server-only';
import {unstable_cache} from 'next/cache';
import type snapshot from '@/data/catalogue.json';
import packed0 from '@/data/catalogue-packed-0.json';
import packed1 from '@/data/catalogue-packed-1.json';
import packed2 from '@/data/catalogue-packed-2.json';
import packed3 from '@/data/catalogue-packed-3.json';
import packed4 from '@/data/catalogue-packed-4.json';
import packed5 from '@/data/catalogue-packed-5.json';
import packed6 from '@/data/catalogue-packed-6.json';
import packed7 from '@/data/catalogue-packed-7.json';
import {gunzipSync} from 'node:zlib';
import safety from '@/data/personal-safety.json';
import kidsPacked0 from '@/data/kids-packed-0.json';
import kidsPacked1 from '@/data/kids-packed-1.json';
import kidsPacked2 from '@/data/kids-packed-2.json';
import kidsPacked3 from '@/data/kids-packed-3.json';
const baseCatalogue=JSON.parse(gunzipSync(Buffer.from([packed0,packed1,packed2,packed3,packed4,packed5,packed6,packed7].join(''),'base64')).toString('utf8')) as typeof snapshot;
const kids=JSON.parse(gunzipSync(Buffer.from([kidsPacked0,kidsPacked1,kidsPacked2,kidsPacked3].join(''),'base64')).toString('utf8')) as typeof snapshot;
const catalogue=[...new Map([...baseCatalogue,...safety,...kids].map(p=>[p.slug,p])).values()] as typeof snapshot;
export function getCatalogueSnapshot(){return catalogue;}
export type CatalogueProduct = (typeof catalogue)[number];
type SupplierProduct = {handle:string;variants:{id:number;title:string;price:string;available:boolean}[]};
const source='https://perfectdealz.co.za';
function retail(cost:number,slug:string) {
 const target=slug==='8l-air-fryer-with-digital-led-display'?cost+380:slug==='8l-digital-touch-panel-air-fryer'?cost+400:Math.max(cost*1.35,cost+50);
 return Math.ceil((target-9)/10)*10+9;
}
async function readSource(path:string,fresh=false) {
 const response=await fetch(source+path,{...(fresh?{cache:'no-store' as const}:{next:{revalidate:300}}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error(`Catalogue source unavailable (${response.status})`);
 return response.json();
}
function update(product:CatalogueProduct,supplier?:SupplierProduct):CatalogueProduct {
 const variants=product.variants.map(v=>{
  const current=supplier?.variants.find(s=>String(s.id)===v.id || s.title===v.title || (s.title==='Default Title' && v.title==='Standard'));
  const cost=Number(current?.price);
  return {...v,price:current&&Number.isFinite(cost)&&cost>0?retail(cost,product.slug):v.price,supplierAvailable:!!current?.available&&Number.isFinite(cost)&&cost>0};
 });
 return {...product,variants,price:Math.min(...variants.map(v=>v.price)),supplierAvailable:variants.some(v=>v.supplierAvailable)};
}
async function collectionSourceRaw(collection:string) {
 const result:SupplierProduct[]=[];
 for(let page=1;page<=30;page++) {
  const data=await readSource(`/collections/${collection}/products.json?limit=250&page=${page}`,true);
  if(!Array.isArray(data.products))throw new Error('Invalid catalogue source');
  result.push(...data.products.map((p:SupplierProduct)=>({handle:p.handle,variants:p.variants.map(v=>({id:v.id,title:v.title,price:v.price,available:v.available}))})));
  if(data.products.length<250)return result;
 }
 throw new Error('Catalogue pagination limit exceeded');
}
const collectionSource=unstable_cache(collectionSourceRaw,['perfect-dealz-live-v1'],{revalidate:300});
export async function getCatalogueProduct(slug:string,fresh=false) {
 const product=catalogue.find(p=>p.slug===slug);if(!product)return null;
 try {const data=await readSource(`/products/${encodeURIComponent(slug)}.js`,fresh);return update(product,{handle:slug,variants:data.variants.map((v:SupplierProduct['variants'][number])=>({...v,price:String(Number(v.price)/100)}))});}
 catch {return update(product);}
}
export async function getCatalogueProducts(search='',category='',sort='newest',availableOnly=false) {
 const term=search.trim().toLowerCase();
 const selected=catalogue.filter(p=>(!category||p.collections.includes(category))&&(!term||`${p.name} ${p.description} ${p.category.name}`.toLowerCase().includes(term)));
 const collections=[...new Set(selected.map(p=>p.category.slug))];
 const sources=await Promise.all(collections.map(async c=>{try{return await collectionSource(c);}catch{return [] as SupplierProduct[];}}));
 const live=new Map(sources.flat().map(p=>[p.handle,p]));
 let products=selected.map(p=>update(p,live.get(p.slug)));
 // A retained launch item may sit outside the collection; check its product feed.
 products=await Promise.all(products.map(p=>!live.has(p.slug)&&p.slug.includes('air-fryer')?getCatalogueProduct(p.slug).then(v=>v??p):p));
 return products.filter(p=>!availableOnly||p.supplierAvailable).sort((a,b)=>sort==='price-low'?a.price-b.price:sort==='price-high'?b.price-a.price:0);
}

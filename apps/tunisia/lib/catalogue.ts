import raw from '@/data/catalogue.json';
export const locales = ['en','fr','ar'] as const;
export type Locale = typeof locales[number];
export type Translation = Record<Locale,string>;
export type Product = {id:string; slug:string; supplierProductId:string; title:Translation; description:Translation; category:string; image:string; priceMillimes:number; stock:number; active:boolean};
export function validateCatalogue(input:unknown):Product[]{
 if(!Array.isArray(input)) throw new Error('Catalogue must be an array');
 const ids=new Set<string>(), slugs=new Set<string>();
 for(const p of input){
  if(!p || !/^[a-z0-9-]+$/.test(p.slug) || typeof p.id!=='string' || !p.id || ids.has(p.id) || slugs.has(p.slug)) throw new Error('Invalid or duplicate product identifier');
  if(typeof p.supplierProductId!=='string'||!p.supplierProductId) throw new Error('Supplier product identifier required');
  for(const key of ['title','description']) for(const locale of locales) if(typeof p[key]?.[locale]!=='string'||!p[key][locale].trim()) throw new Error('Complete translations required');
  if(!Number.isSafeInteger(p.priceMillimes)||p.priceMillimes<=0||!Number.isSafeInteger(p.stock)||p.stock<0||typeof p.active!=='boolean') throw new Error('Invalid price, stock or publication state');
  if(typeof p.category!=='string'||typeof p.image!=='string'||!p.image.startsWith('https://')) throw new Error('Category and HTTPS product image required');
  ids.add(p.id); slugs.add(p.slug);
 }
 return input as Product[];
}
export const products=validateCatalogue(raw).filter(p=>p.active);
export function money(amount:number,locale:Locale){return new Intl.NumberFormat(locale==='ar'?'ar-TN':locale==='fr'?'fr-TN':'en-TN',{style:'currency',currency:'TND',minimumFractionDigits:3,maximumFractionDigits:3}).format(amount/1000)}

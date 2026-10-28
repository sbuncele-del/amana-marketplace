import type {Product,Translation} from './catalogue';
export type SupplierContent={sourceName:string;sourceUrl:string;sourceProductId:string;slug:string;category:string;title:Translation;description:Translation;images:string[]};
type Row={uuid?:unknown;name?:unknown;price?:unknown;available_qte?:unknown;status?:unknown;variants?:unknown};
function units(value:unknown,scale:number){
 if(typeof value!=='number'&&typeof value!=='string')return null;
 if(!/^\d+(\.\d{1,3})?$/.test(String(value)))return null;
 const result=Number(value)*scale;
 return Number.isSafeInteger(Math.round(result))&&Math.abs(result-Math.round(result))<0.00001?Math.round(result):null;
}
export function normaliseShipper(rows:Row[],content:SupplierContent[]):Product[]{
 const out:Product[]=[];
 for(const row of rows){
  const info=content.find(c=>c.sourceProductId===row.uuid)||content.find(c=>c.sourceName===row.name);
  if(!info||String(row.status).toLowerCase()!=='active')continue;
  const image=info.images.find(s=>s.startsWith('https://cdn.shipper.network/'));
  if(!image)continue;
  const variants=Array.isArray(row.variants)&&row.variants.length?row.variants:[null];
  for(const variant of variants){
   const uuid=variant?.uuid??row.uuid;
   if(typeof uuid!=='string'||!/^[a-zA-Z0-9-]+$/.test(uuid))continue;
   const price=units(variant?.price??row.price,1000),stock=units(variant?.available_qte??row.available_qte,1);
   if(price===null||price<=0||stock===null)continue;
   // Explicit public allowlist: supplier cost and private identifiers never enter client props.
   const label=typeof variant?.name==='string'?variant.name:'';
   out.push({id:uuid,supplierProductId:uuid,slug:info.slug+(variant?'-'+uuid:''),title:label?{en:info.title.en+' — '+label,fr:info.title.fr+' — '+label,ar:info.title.ar+' — '+label}:info.title,description:info.description,category:info.category,image,images:info.images,priceMillimes:price,stock,active:true});
  }
 }
 return out;
}

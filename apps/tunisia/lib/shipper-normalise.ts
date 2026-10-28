import type {Product,Translation} from './catalogue';
export type SupplierContent={sourceName:string;sourceUrl:string;sourceProductId:string;slug:string;category:string;title:Translation;description:Translation;images:string[]};
type Row={uuid?:unknown;name?:unknown;price?:unknown;available_qte?:unknown;status?:unknown;variants?:unknown};
function units(value:unknown,scale:number){
 if(typeof value!=='number'&&typeof value!=='string')return null;
 const text=String(value).trim().replace(/(\.\d*?)0+$/, '$1').replace(/\.$/,'');
 if(!/^\d+(\.\d{1,3})?$/.test(text))return null;
 const result=Number(text)*scale;
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
  for(const [variantIndex,variant] of variants.entries()){
   const uuid=variant?.uuid??row.uuid;
   if(typeof uuid!=='string'||!/^[a-zA-Z0-9-]+$/.test(uuid))continue;
   const price=units(variant?.price??row.price,1000),stock=units(variant?.available_qte??row.available_qte,1);
   if(price===null||price<=0||stock===null)continue;
   // Explicit public allowlist: supplier cost and private identifiers never enter client props.
   const label=typeof variant?.name==='string'?variant.name.trim():'';
   // Some supplier variants repeat the parent name instead of providing attributes.
   // Number the options without inventing colours, sizes or other attributes.
   const parentLabel=label===String(row.name).trim()||label===info.sourceName.trim();
   const title=variant?{en:info.title.en+' — '+(label&&!parentLabel?label:`Option ${variantIndex+1}`),fr:info.title.fr+' — '+(label&&!parentLabel?label:`Option ${variantIndex+1}`),ar:info.title.ar+' — '+(label&&!parentLabel?label:`الخيار ${variantIndex+1}`)}:info.title;
   out.push({id:uuid,supplierProductId:uuid,slug:info.slug+(variant?'-'+uuid:''),title,description:info.description,category:info.category,image,images:info.images,priceMillimes:price,stock,active:true});
  }
 }
 return out;
}

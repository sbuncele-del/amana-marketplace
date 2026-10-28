import type {Product,Translation} from './catalogue';
export type SupplierContent={sourceName:string;sourceUrl:string;sourceProductId:string;slug:string;category:string;title:Translation;description:Translation;images:string[];originalSupplierCopy?:boolean;retailerProductIds?:string[];variantLabels?:Record<string,string>};
type Row={uuid?:unknown;name?:unknown;link?:unknown;price?:unknown;available_qte?:unknown;status?:unknown;variants?:unknown};
const productName=(value:unknown)=>typeof value==='string'?value.normalize('NFKC').replace(/\s+/g,' ').trim().toLocaleLowerCase('fr'):'';
function linkedSource(value:unknown){try{const url=new URL(String(value));return url.origin==='https://app.shipper.market'?url.pathname.match(/^\/products\/([a-zA-Z0-9-]+)\/?$/)?.[1]:undefined;}catch{return undefined;}}
function units(value:unknown,scale:number){
 if(typeof value!=='number'&&typeof value!=='string')return null;
 const text=String(value).trim().replace(/(\.\d*?)0+$/, '$1').replace(/\.$/,'');
 if(!/^\d+(\.\d{1,3})?$/.test(text))return null;
 const result=Number(text)*scale;
 return Number.isSafeInteger(Math.round(result))&&Math.abs(result-Math.round(result))<0.00001?Math.round(result):null;
}
export function normaliseShipper(rows:Row[],content:SupplierContent[],onHold?:(reason:string)=>void):Product[]{
 const out:Product[]=[];
 const byId=new Map(content.flatMap(c=>[c.sourceProductId,...(c.retailerProductIds||[])].map(id=>[id,c] as const)));
 const byName=new Map<string,SupplierContent[]>();
 for(const item of content){const key=productName(item.sourceName);byName.set(key,[...(byName.get(key)||[]),item]);}
 for(const row of rows){
  const matches=byName.get(productName(row.name));
  // Never guess between two suppliers using the same product title.
  const info=byId.get(String(row.uuid))||byId.get(linkedSource(row.link)||'')||(matches?.length===1?matches[0]:undefined);
  if(!info){onHold?.(matches&&matches.length>1?'ambiguous_content':'missing_content');continue;}
  if(String(row.status).toLowerCase()!=='active'){onHold?.('inactive');continue;}
  const image=info.images.find(s=>s.startsWith('https://cdn.shipper.network/'));
  if(!image){onHold?.('missing_image');continue;}
  const before=out.length;let holdReason='invalid_variant';
  const variants=Array.isArray(row.variants)&&row.variants.length?row.variants:[null];
  for(const [variantIndex,variant] of variants.entries()){
   const uuid=variant?.uuid??row.uuid;
   if(typeof uuid!=='string'||!/^[a-zA-Z0-9-]+$/.test(uuid))continue;
   const price=units(variant?.price??row.price,1000),stock=units(variant?.available_qte??row.available_qte,1);
   if(price===null||price<=0){holdReason='invalid_price';continue;}
   if(stock===null){holdReason='invalid_stock';continue;}
   // Explicit public allowlist: supplier cost and private identifiers never enter client props.
   const label=info.variantLabels?.[uuid]||(typeof variant?.name==='string'?variant.name.trim():'');
   // Some supplier variants repeat the parent name instead of providing attributes.
   // Number the options without inventing colours, sizes or other attributes.
   const parentLabel=productName(label)===productName(row.name)||productName(label)===productName(info.sourceName);
   const title=variant?{en:info.title.en+' — '+(label&&!parentLabel?label:`Option ${variantIndex+1}`),fr:info.title.fr+' — '+(label&&!parentLabel?label:`Option ${variantIndex+1}`),ar:info.title.ar+' — '+(label&&!parentLabel?label:`الخيار ${variantIndex+1}`)}:info.title;
   out.push({id:uuid,supplierProductId:uuid,groupId:String(row.uuid),groupSlug:info.slug,groupTitle:info.title,...(variant?{optionLabel:label&&!parentLabel?label:`Option ${variantIndex+1}`} :{}),slug:info.slug+(variant?'-'+uuid:''),title,description:info.description,category:info.category,image,images:info.images,priceMillimes:price,stock,active:true,...(info.originalSupplierCopy?{originalSupplierCopy:true}:{})});
  }
  if(out.length===before)onHold?.(holdReason);
 }
 return out;
}

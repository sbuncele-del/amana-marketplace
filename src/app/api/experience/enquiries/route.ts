import {NextRequest,NextResponse} from 'next/server';
import {sameRequestOrigin} from '@/lib/experience/request-origin';
import {createHash} from 'node:crypto';
import {enquirySchema} from '@/lib/experience/workflows';
import {transaction,insertRecord,event,ensureExperienceSchema,experiencePool} from '@/lib/experience/store';
import {getCatalogueProduct,type CatalogueProduct} from '@/lib/catalogue';
import {limitPublicRequest} from '@/lib/experience/public-rate-limit';
export const maxDuration=60;
export async function POST(request:NextRequest){
 try{
  if(!request.headers.get('content-type')?.includes('application/json'))return NextResponse.json({error:'Please submit the order form.'},{status:415});
  if(Number(request.headers.get('content-length')||0)>20000)return NextResponse.json({error:'This order is too large.'},{status:413});
  if(!sameRequestOrigin(request))return NextResponse.json({error:'Please submit from the store.'},{status:403});
  const parsed=enquirySchema.safeParse(await request.json());if(!parsed.success)return NextResponse.json({error:'Check your contact details, postcode and selected items.'},{status:400});
  const b=parsed.data;const hash=createHash('sha256').update(JSON.stringify({...b,requestKey:undefined})).digest('hex');
  await ensureExperienceSchema();const existing=(await experiencePool().query('SELECT k.request_hash,r.reference,r.data FROM experience_request_keys k JOIN experience_records r ON r.id=k.record_id WHERE k.key=$1',[b.requestKey])).rows[0];if(existing){if(existing.request_hash!==hash)throw new Error('REQUEST_CHANGED');return NextResponse.json({reference:existing.reference,subtotalCents:existing.data.subtotalCents},{status:201,headers:{'Cache-Control':'no-store'}});}
  await limitPublicRequest(request,'enquiry');
  const started=Date.now();const products=new Map<string,Promise<CatalogueProduct|null>>();const items:{id:string;slug:string;name:string;option:string;quantity:number;unitPriceCents:number;image:string}[]=[];
  for(let offset=0;offset<b.lines.length;offset+=4){if(Date.now()-started>30000)throw new Error('SUPPLIER_TIMEOUT');items.push(...await Promise.all(b.lines.slice(offset,offset+4).map(async l=>{const [slug,id]=l.id.split(':');if(!products.has(slug))products.set(slug,getCatalogueProduct(slug,true));const p=await products.get(slug);const v=p?.variants.find(v=>v.id===id);if(!p||!v?.supplierAvailable)throw new Error('STOCK_CHANGED');return {id:l.id,slug:p.slug,name:p.name,option:v.title,quantity:l.quantity,unitPriceCents:Math.round(v.price*100),image:v.image||p.images[0]};})));}
  const result=await transaction(async client=>{
   await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[b.requestKey]);
   const prior=(await client.query('SELECT k.request_hash,r.reference,r.data FROM experience_request_keys k JOIN experience_records r ON r.id=k.record_id WHERE k.key=$1',[b.requestKey])).rows[0];
   if(prior){if(prior.request_hash!==hash)throw new Error('REQUEST_CHANGED');return {reference:prior.reference,subtotalCents:prior.data.subtotalCents};}
   const subtotalCents=items.reduce((sum,i)=>sum+i.quantity*i.unitPriceCents,0);
   const order=await insertRecord(client,{kind:'ORDER',status:'ENQUIRY',dueAt:new Date(Date.now()+2*3600000),data:{customerName:b.name,phone:b.phone,email:b.email||'',city:b.city,postcode:b.postcode,contactPreference:b.contactPreference,followUpConsent:b.followUpConsent,contactWindow:b.contactWindow||'',items,subtotalCents,shippingCents:null,source:'STOREFRONT',country:'ZA',currency:'ZAR',consentRecordedAt:new Date().toISOString()}});
   await event(client,order.id,null,'ENQUIRY_RECEIVED','Customer requested their delivered total.');
   await client.query('INSERT INTO experience_request_keys(key,request_hash,record_id) VALUES($1,$2,$3)',[b.requestKey,hash,order.id]);
   await client.query('DELETE FROM experience_rate_limits WHERE expires_at<now()');
   return {reference:order.reference,subtotalCents};
  });
  return NextResponse.json(result,{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(e){const message=e instanceof Error?e.message:'';if(message==='STOCK_CHANGED')return NextResponse.json({error:'An item’s availability changed. Please refresh your cart before requesting your order.'},{status:409});if(message==='RATE_LIMIT')return NextResponse.json({error:'Please wait before submitting another enquiry.'},{status:429});if(message==='REQUEST_CHANGED')return NextResponse.json({error:'Your enquiry changed. Please start a new request.'},{status:409});return NextResponse.json({error:'We could not save your enquiry. Nothing has been submitted. Please try again or contact Amana.'},{status:503});}
}

// Read-only build verification. Never log credentials or raw supplier/customer data.
const token=process.env.SHIPPER_NETWORK_API_KEY || process.env.TUNISIA_SHIPPER_API_KEY;
import fs from 'node:fs';
const content=JSON.parse(fs.readFileSync(new URL('../data/shipper-content.json',import.meta.url),'utf8'));
const prefix='[Tunisia Shipper]';
if(!token){console.log(prefix+' not configured in this environment; skipping read-only check.');}
else {
 const base='https://server.shipper.network/api/v1';
 async function read(path){
  const r=await fetch(base+path,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw new Error(`HTTP ${r.status}`);
  return r.json();
 }
 try {
  const countries=await read('/countries');
  const list=Array.isArray(countries)?countries:countries.data;
  console.log(prefix+' geography '+JSON.stringify({ok:true,tunisiaAvailable:Array.isArray(list)&&list.some(c=>c.code==='TN')}));
 } catch { console.log(prefix+' geography check failed; no response body logged.'); }
 try {
  const result=await read('/products?per_page=5&page=1');
  const rows=Array.isArray(result.data)?result.data:[];
  console.log(prefix+' catalogue '+JSON.stringify({ok:true,sampleCount:rows.length,total:result.pagination?.total??null,lastPage:result.pagination?.last_page??null,fields:rows[0]?Object.keys(rows[0]).sort():[]}));
  console.log(prefix+' mapping '+JSON.stringify(rows.map(row=>({status:row.status,priceType:typeof row.price,priceDecimals:String(row.price).split('.')[1]?.length??0,stockType:typeof row.available_qte,matched:content.some(c=>c.sourceProductId===row.uuid||c.sourceName===row.name),linkHost:typeof row.link==='string'?(()=>{try{return new URL(row.link).hostname}catch{return 'unparseable'}})():null,linkHasUuidSegment:typeof row.link==='string'&&/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\/|$|\?)/i.test(row.link),variants:Array.isArray(row.variants)?row.variants.length:null}))));
  if(rows[0]?.uuid && /^[a-zA-Z0-9-]+$/.test(rows[0].uuid)){
   const detail=await read('/products/'+encodeURIComponent(rows[0].uuid));
   console.log(prefix+' product detail '+JSON.stringify({ok:true,fields:Object.keys(detail).sort()}));
  }
 } catch(e){console.log(prefix+' catalogue check failed '+(e.message?.match(/^HTTP \d{3}$/)?.[0]||'(network or response error)')+'; no response body logged.');}
}

// Read-only build verification. Never log credentials or raw supplier/customer data.
const token=process.env.SHIPPER_NETWORK_API_KEY || process.env.TUNISIA_SHIPPER_API_KEY;
import fs from 'node:fs';
import {normaliseShipper} from '../lib/shipper-normalise.ts';
const content=JSON.parse(fs.readFileSync(new URL('../data/shipper-content.json',import.meta.url),'utf8'));
const manifestUrl=new URL('../data/shipper-content-batches.json',import.meta.url);
if(fs.existsSync(manifestUrl))for(const file of JSON.parse(fs.readFileSync(manifestUrl,'utf8')))content.push(...JSON.parse(fs.readFileSync(new URL('../data/'+file,import.meta.url),'utf8')));
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
  const rows=[];let reportedTotal=null;
  for(let page=1;page<=20;page++){
   const result=await read('/products?per_page=100&page='+page);
   if(!Array.isArray(result.data))throw new Error('Invalid catalogue');
   rows.push(...result.data);reportedTotal=result.pagination?.total??null;
   const last=Number(result.pagination?.last_page);
   if(Number.isInteger(last)&&last>0){if(last>20)throw new Error('Verified page limit exceeded');if(page>=last)break;}
   else if(result.data.length<100)break;else throw new Error('Missing pagination');
  }
  const published=normaliseShipper(rows,content),ids=new Set(published.map(p=>p.id));
  const publishedParents=rows.filter(r=>(Array.isArray(r.variants)&&r.variants.length?r.variants:[r]).some(v=>ids.has(v.uuid))).length;
  console.log(prefix+' reconciliation '+JSON.stringify({ok:true,accountProducts:rows.length,reportedTotal,contentProducts:content.length,publishedProducts:publishedParents,publishedEntries:published.length,heldProducts:rows.length-publishedParents,zeroStockEntries:published.filter(p=>p.stock===0).length,duplicateEntries:published.length-ids.size}));
  if(rows[0]?.uuid && /^[a-zA-Z0-9-]+$/.test(rows[0].uuid)){
   const detail=await read('/products/'+encodeURIComponent(rows[0].uuid));
   console.log(prefix+' product detail '+JSON.stringify({ok:true,fields:Object.keys(detail).sort()}));
  }
 } catch(e){console.log(prefix+' catalogue check failed '+(e.message?.match(/^HTTP \d{3}$/)?.[0]||'(network or response error)')+'; no response body logged.');}
}

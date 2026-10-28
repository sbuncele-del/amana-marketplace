// Read-only build verification. Never log credentials or raw supplier/customer data.
const token=process.env.SHIPPER_NETWORK_API_KEY || process.env.TUNISIA_SHIPPER_API_KEY;
import fs from 'node:fs';
import {bindAccountContent} from '../lib/shipper-content.ts';
import {normaliseShipper} from '../lib/shipper-normalise.ts';
let content=JSON.parse(fs.readFileSync(new URL('../data/shipper-content.json',import.meta.url),'utf8'));
const manifestUrl=new URL('../data/shipper-content-batches.json',import.meta.url);
if(fs.existsSync(manifestUrl))for(const file of JSON.parse(fs.readFileSync(manifestUrl,'utf8')))content.push(...JSON.parse(fs.readFileSync(new URL('../data/'+file,import.meta.url),'utf8')));
// Exact identifiers and variant labels stay in the private Tunisia database.
if(process.env.DATABASE_URL||process.env.POSTGRES_URL){
 const {Pool}=await import('pg');
 const pool=new Pool({connectionString:process.env.DATABASE_URL||process.env.POSTGRES_URL,max:1,connectionTimeoutMillis:10000});
 try{const {rows}=await pool.query("SELECT name,payload FROM public.plentovo_tn_catalogue_metadata WHERE name IN ('bindings','content')");const bindings=rows.find(r=>r.name==='bindings')?.payload,extra=rows.find(r=>r.name==='content')?.payload;if(Array.isArray(bindings)&&Array.isArray(extra))content=bindAccountContent([...content,...extra],bindings);}
 catch{console.log('[Tunisia Shipper] private metadata check unavailable; using base content.');}
 finally{await pool.end();}
}
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
  for(let page=1;page<=150;page++){
   if(page>1)await new Promise(resolve=>setTimeout(resolve,650));
   const result=await read('/products?per_page=100&page='+page);
   if(!Array.isArray(result.data))throw new Error('Invalid catalogue');
   rows.push(...result.data);reportedTotal=result.pagination?.total??null;
   const last=Number(result.pagination?.last_page);
   if(Number.isInteger(last)&&last>0){if(last>150)throw new Error('Verified page limit exceeded');if(page>=last)break;}
   else if(result.data.length<100)break;else throw new Error('Missing pagination');
  }
  const heldReasons={};
  const published=normaliseShipper(rows,content,reason=>heldReasons[reason]=(heldReasons[reason]||0)+1),ids=new Set(published.map(p=>p.id));
  const publishedParents=rows.filter(r=>(Array.isArray(r.variants)&&r.variants.length?r.variants:[r]).some(v=>ids.has(v.uuid))).length;
  console.log(prefix+' reconciliation '+JSON.stringify({ok:true,accountProducts:rows.length,reportedTotal,contentProducts:content.length,publishedProducts:publishedParents,publishedEntries:published.length,heldProducts:rows.length-publishedParents,zeroStockEntries:published.filter(p=>p.stock===0).length,duplicateEntries:published.length-ids.size,heldReasons}));
  if(rows[0]?.uuid && /^[a-zA-Z0-9-]+$/.test(rows[0].uuid)){
   const detail=await read('/products/'+encodeURIComponent(rows[0].uuid));
   console.log(prefix+' product detail '+JSON.stringify({ok:true,fields:Object.keys(detail).sort()}));
  }
 } catch(e){console.log(prefix+' catalogue check failed '+(e.message?.match(/^HTTP \d{3}$/)?.[0]||'(network or response error)')+'; no response body logged.');}
}

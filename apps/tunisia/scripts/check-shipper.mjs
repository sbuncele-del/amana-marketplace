// Read-only build verification. Never log credentials or raw supplier/customer data.
const token=process.env.SHIPPER_NETWORK_API_KEY || process.env.TUNISIA_SHIPPER_API_KEY;
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
  if(rows[0]?.uuid && /^[a-zA-Z0-9-]+$/.test(rows[0].uuid)){
   const detail=await read('/products/'+encodeURIComponent(rows[0].uuid));
   console.log(prefix+' product detail '+JSON.stringify({ok:true,fields:Object.keys(detail).sort()}));
  }
 } catch(e){console.log(prefix+' catalogue check failed '+(e.message?.match(/^HTTP \d{3}$/)?.[0]||'(network or response error)')+'; no response body logged.');}
}

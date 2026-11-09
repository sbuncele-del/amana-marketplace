'use client';
import { useState } from 'react';
export default function DemandResearch() {
  const [batch,setBatch]=useState('outdoor');
  const [window,setWindow]=useState('30d');
  const [searchType,setSearchType]=useState('web');
  const [result,setResult]=useState<unknown>(null);
  const [busy,setBusy]=useState(false);
  async function run() {
    setBusy(true);
    try { const r=await fetch('/api/marketing/demand',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({batch,window,searchType})});setResult(await r.json()); }
    catch { setResult({error:'Research request failed. No trend verified.'}); }
    finally {setBusy(false);}
  }
  return <main className="mx-auto max-w-5xl p-8 space-y-6"><h1 className="text-3xl font-bold">Plentovo demand research</h1><p>South African search interest. Administrator sign-in required. Results inform product selection and need stock, margin and retailer checks before promotion.</p><div className="flex flex-wrap gap-4"><label>Category <select className="border p-2" value={batch} onChange={e=>setBatch(e.target.value)}>{['outdoor','home','kitchen','beauty','electronics','family'].map(x=><option key={x}>{x}</option>)}</select></label><label>Window <select className="border p-2" value={window} onChange={e=>setWindow(e.target.value)}>{['7d','30d','90d','12m'].map(x=><option key={x}>{x}</option>)}</select></label><label>Search type <select className="border p-2" value={searchType} onChange={e=>setSearchType(e.target.value)}>{['web','shopping'].map(x=><option key={x}>{x}</option>)}</select></label><button className="rounded bg-black px-5 py-2 text-white disabled:opacity-50" disabled={busy} onClick={run}>{busy?'Checking…':'Check demand'}</button></div><p>One comparison per click. Saved results reused for 24 hours. Maximum 24 provider requests per South African day. Nothing publishes automatically.</p>{result!==null&&<pre className="overflow-auto whitespace-pre-wrap rounded border p-4 text-sm">{JSON.stringify(result,null,2)}</pre>}</main>;
}

'use client';
import {useEffect,useState} from 'react';
import {usePathname,useSearchParams} from 'next/navigation';
import {useSession} from 'next-auth/react';

export function EmailInterestCapture(){
 const pathname=usePathname(),params=useSearchParams(),{status}=useSession();
 const search=params.get('search')||'',slug=pathname.startsWith('/product/')?pathname.split('/')[2]:'';
 useEffect(()=>{if(status!=='authenticated'||(!search&&!slug))return;
 const timer=setTimeout(()=>{void fetch('/api/marketing/interests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(slug?{slug}:{search})}).catch(()=>{});},1500);
 return()=>clearTimeout(timer);
 },[pathname,search,slug,status]);return null;
}
export function EmailInterestPreference(){
 const [enabled,setEnabled]=useState(false),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{let active=true;void fetch('/api/marketing/interests').then(async r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{if(active){setEnabled(d.enabled);setReady(true);}}).catch(()=>{if(active)setMessage('Preferences could not be loaded.');});return()=>{active=false;};},[]);
 async function toggle(value:boolean){setBusy(true);setMessage('');try{const r=await fetch('/api/marketing/interests',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:value})});if(!r.ok)throw Error();setEnabled(value);setMessage('Preference saved.');}catch{setMessage('Could not save. Please try again.');}finally{setBusy(false);}}
 return <section className="rounded-xl border bg-white p-6"><h2 className="text-lg font-bold">Relevant email recommendations</h2><label className="mt-4 flex gap-3 text-sm"><input type="checkbox" checked={enabled} disabled={!ready||busy} onChange={e=>void toggle(e.target.checked)}/>Use my Plentovo searches and product views to personalise discovery emails.</label><p className="mt-3 text-sm text-gray-500">Optional. Applies when you are signed in and have confirmed your newsletter subscription. We use matched products from the last 30 days. Turning this off stops using that history in emails.</p>{message&&<p role="status" className="mt-3 text-sm">{message}</p>}</section>;
}

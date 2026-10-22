'use client';
import {useState,useEffect} from 'react';
import Link from 'next/link';
import {consentKey,consentChanged,openConsent,readConsent} from './consent-analytics';
export function CookieConsent(){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{setVisible(!readConsent());const open=()=>setVisible(true);window.addEventListener(openConsent,open);return()=>window.removeEventListener(openConsent,open);},[]);
 function choose(value:'accepted'|'declined'){
  const wasAccepted=readConsent()==='accepted';
  try{localStorage.setItem(consentKey,value);localStorage.removeItem('amana-cookie-consent');}catch{setVisible(false);return;}
  window.dispatchEvent(new Event(consentChanged));setVisible(false);
  if(wasAccepted&&value==='declined'){
   for(const entry of document.cookie.split(';')){const name=entry.split('=')[0].trim();if(name==='_ga'||name.startsWith('_ga_')||name==='_gid'){for(const domain of ['',`; domain=${location.hostname}`,`; domain=.${location.hostname}`])document.cookie=`${name}=; max-age=0; path=/${domain}`;}}
   window.location.reload();
  }
 }
 if(!visible)return null;
 return <section aria-label="Cookie preferences" className="fixed inset-x-0 bottom-0 z-50 p-4"><div className="mx-auto max-w-4xl rounded-2xl border border-white/20 bg-[#171B20] p-6 text-white shadow-2xl"><h2 className="font-bold">Your cookie choices</h2><p className="mt-2 text-sm leading-6 text-white/80">Essential storage keeps your account, cart and delivery preferences working. You can also allow optional analytics to help us understand site usage. Read our <Link href="/cookies" className="underline">Cookie policy</Link> and <Link href="/privacy" className="underline">Privacy policy</Link>.</p><div className="mt-4 flex flex-wrap gap-3"><button onClick={()=>choose('declined')} className="min-h-11 rounded-lg border border-white/40 px-5 text-sm font-semibold">Essential only</button><button onClick={()=>choose('accepted')} className="min-h-11 rounded-lg bg-[#DA292B] px-5 text-sm font-semibold text-white">Accept analytics</button></div></div></section>;
}

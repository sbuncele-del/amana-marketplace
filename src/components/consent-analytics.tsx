'use client';
import {useEffect,useState} from 'react';
import Script from 'next/script';
import {Analytics} from '@vercel/analytics/react';
export const consentKey='plentovo_cookie_consent_v1';
export const consentChanged='plentovo:consent-changed';
export const openConsent='plentovo:open-consent';
export function readConsent(){try{return localStorage.getItem(consentKey)||localStorage.getItem('amana-cookie-consent');}catch{return null;}}
export function ConsentAnalytics({measurementId}:{measurementId?:string}){
 const [accepted,setAccepted]=useState(false);
 useEffect(()=>{const update=()=>setAccepted(readConsent()==='accepted');update();window.addEventListener(consentChanged,update);window.addEventListener('storage',update);return()=>{window.removeEventListener(consentChanged,update);window.removeEventListener('storage',update);};},[]);
 if(!accepted)return null;
 const id=measurementId&&/^G-[A-Z0-9]+$/.test(measurementId)?measurementId:undefined;
 return <>{id&&<><Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive"/><Script id="plentovo-google-analytics" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(id)});`}</Script></>}<Analytics/></>;
}
export function CookiePreferences(){return <button type="button" className="text-xs text-white/60 hover:underline" onClick={()=>window.dispatchEvent(new Event(openConsent))}>Cookie preferences</button>;}

'use client';
import Link from 'next/link';
import {useEffect,useState,type RefObject} from 'react';
import {mobileCopy} from '../../../packages/storefront/mobile-copy';
type Locale=keyof typeof mobileCopy;
type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
export function MobilePurchaseBar({target,price,label,disabled,onAdd,cartHref,cartLabel,added}:{target:RefObject<HTMLButtonElement|null>;price:string;label:string;disabled:boolean;onAdd:()=>void;cartHref:string;cartLabel:string;added:boolean}){
 const [show,setShow]=useState(false);
 useEffect(()=>{if(!target.current||typeof IntersectionObserver==='undefined')return;const observer=new IntersectionObserver(([entry])=>setShow(!entry.isIntersecting),{threshold:0});observer.observe(target.current);return()=>observer.disconnect();},[target]);
 if(!show)return null;
 return <div className="mobile-purchase"><strong dir="auto">{price}</strong><button type="button" className="mobile-action" disabled={disabled} onClick={onAdd}>{label}</button>{added&&<Link href={cartHref}>{cartLabel} →</Link>}</div>;
}
export function MarketInstall({locale,basePath}:{locale:Locale;basePath:string}){
 const c=mobileCopy[locale];const [prompt,setPrompt]=useState<InstallPrompt|null>(null),[installed,setInstalled]=useState(true),[instructions,setInstructions]=useState(false);
 useEffect(()=>{const media=window.matchMedia('(display-mode: standalone)');const update=()=>setInstalled(media.matches||Boolean((navigator as Navigator&{standalone?:boolean}).standalone));const available=(e:Event)=>{e.preventDefault();setPrompt(e as InstallPrompt);};const completed=()=>{setInstalled(true);setPrompt(null);};update();media.addEventListener('change',update);window.addEventListener('beforeinstallprompt',available);window.addEventListener('appinstalled',completed);if('serviceWorker' in navigator&&window.isSecureContext)void navigator.serviceWorker.register(basePath+'/sw.js',{scope:basePath+'/'}).catch(()=>{});return()=>{media.removeEventListener('change',update);window.removeEventListener('beforeinstallprompt',available);window.removeEventListener('appinstalled',completed);};},[basePath]);
 async function install(){if(!prompt){setInstructions(v=>!v);return;}try{await prompt.prompt();await prompt.userChoice;}finally{setPrompt(null);}}
 if(installed)return null;
 return <section className="market-install" aria-label={c.install}><h2>{c.keep}</h2><p>{c.intro}</p><button type="button" onClick={()=>void install()} aria-expanded={instructions} aria-controls="market-install-help">{prompt?c.install:c.how}</button>{instructions&&<p id="market-install-help">{c.instructions}</p>}</section>;
}

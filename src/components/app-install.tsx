'use client';
import {useEffect,useState} from 'react';
type InstallPrompt = Event & {prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
export function AppInstall(){
 const [prompt,setPrompt]=useState<InstallPrompt|null>(null);
 const [installed,setInstalled]=useState(true);
 const [instructions,setInstructions]=useState(false);
 useEffect(()=>{
  const standalone=window.matchMedia('(display-mode: standalone)');
  const update=()=>setInstalled(standalone.matches||Boolean((navigator as Navigator & {standalone?:boolean}).standalone));
  const available=(e:Event)=>{e.preventDefault();setPrompt(e as InstallPrompt);};
  const completed=()=>{setInstalled(true);setPrompt(null);};
  update();standalone.addEventListener('change',update);
  window.addEventListener('beforeinstallprompt',available);window.addEventListener('appinstalled',completed);
  if('serviceWorker' in navigator && window.isSecureContext){navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{/* Shopping remains available without installation. */});}
  return()=>{standalone.removeEventListener('change',update);window.removeEventListener('beforeinstallprompt',available);window.removeEventListener('appinstalled',completed);};
 },[]);
 async function install(){if(!prompt){setInstructions(v=>!v);return;}try{await prompt.prompt();await prompt.userChoice;}finally{setPrompt(null);}}
 if(installed)return null;
 return <section aria-label="Install Plentovo" className="mx-auto mt-8 max-w-[1800px] px-4 pb-5 md:hidden"><div className="rounded-xl border bg-white p-4"><h2 className="font-bold">Keep good things close.</h2><p className="mt-1 text-sm text-gray-600">Add Plentovo to your home screen for your next visit.</p><button type="button" onClick={()=>void install()} aria-expanded={instructions} aria-controls="install-instructions" className="mt-3 min-h-11 rounded-lg bg-[#DA292B] px-4 text-sm font-bold text-white">{prompt?'Install Plentovo':'How to install'}</button>{instructions&&<p id="install-instructions" className="mt-3 text-sm leading-6">On iPhone, open this site in Safari, tap Share, then Add to Home Screen. On Android, open your browser menu and choose Install app or Add to Home screen where available.</p>}</div></section>;
}

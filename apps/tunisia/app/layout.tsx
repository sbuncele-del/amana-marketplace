import './globals.css';
import './mobile.css';
import type {Metadata,Viewport} from 'next';
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#DA292B'};
export const metadata:Metadata={manifest:'/tunisia/manifest.webmanifest',appleWebApp:{capable:true,title:'Plentovo Tunisia',statusBarStyle:'default'}};
import {Inter} from 'next/font/google';
const inter=Inter({subsets:['latin'],variable:'--font-inter',display:'swap'});
import {headers} from 'next/headers';
export default async function Layout({children}:{children:React.ReactNode}){
 const locale=(await headers()).get('x-tunisia-locale')||'en';
 return <html translate="no" lang={locale==='ar'?'ar-TN':locale==='fr'?'fr-TN':'en'} dir={locale==='ar'?'rtl':'ltr'}><body className={inter.variable}>{children}</body></html>
}

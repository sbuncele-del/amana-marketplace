import './globals.css';
import './mobile.css';
import type {Metadata,Viewport} from 'next';
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#DA292B'};
export const metadata:Metadata={manifest:'/algeria/manifest.webmanifest',appleWebApp:{capable:true,title:'Plentovo Algeria',statusBarStyle:'default'}};
import {Inter} from 'next/font/google';
const inter=Inter({subsets:['latin'],variable:'--font-inter',display:'swap'});
import {headers} from 'next/headers';
export default async function Layout({children}:{children:React.ReactNode}){
 const locale=(await headers()).get('x-algeria-locale')||'ar';
 return <html lang={locale==='ar'?'ar-DZ':locale==='fr'?'fr-DZ':'en'} dir={locale==='ar'?'rtl':'ltr'}><body className={inter.variable}>{children}</body></html>
}

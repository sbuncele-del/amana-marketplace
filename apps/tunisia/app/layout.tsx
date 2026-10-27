import './globals.css';
import {headers} from 'next/headers';
export default async function Layout({children}:{children:React.ReactNode}){
 const locale=(await headers()).get('x-tunisia-locale')||'en';
 return <html lang={locale==='ar'?'ar-TN':locale==='fr'?'fr-TN':'en'} dir={locale==='ar'?'rtl':'ltr'}><body>{children}</body></html>
}

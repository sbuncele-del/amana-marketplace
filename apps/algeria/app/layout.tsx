import './globals.css';
import {headers} from 'next/headers';
export default async function Layout({children}:{children:React.ReactNode}){
 const locale=(await headers()).get('x-algeria-locale')||'ar';
 return <html lang={locale==='ar'?'ar-DZ':locale==='fr'?'fr-DZ':'en'} dir={locale==='ar'?'rtl':'ltr'}><body>{children}</body></html>
}

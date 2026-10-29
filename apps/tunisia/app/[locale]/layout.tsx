import {SharedCustomerChat} from '../../../../packages/storefront/customer-chat';
import {notFound} from 'next/navigation';
import {locales, type Locale} from '@/lib/catalogue';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'Plentovo Tunisia — Good things. Plenty of choice.',description:'Discover Plentovo Tunisia. Everyday finds for home, kitchen and more.',robots:{index:false,follow:false},icons:{icon:'/tunisia/favicon.svg',apple:'https://plentovo.com/apple-touch-icon.png'}};
export default async function Layout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){
 const {locale}=await params;if(!locales.includes(locale as Locale))notFound();
 return <>{children}<SharedCustomerChat key={locale} locale={locale as Locale} market={locale==='ar'?'تونس':locale==='fr'?'Tunisie':'Tunisia'} basePath="/tunisia" currency="TND"/></>
}

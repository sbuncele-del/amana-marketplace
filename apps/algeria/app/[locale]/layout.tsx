import {notFound} from 'next/navigation';
import {locales, type Locale} from '@/lib/catalogue';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'Plentovo Algeria — Good things. Plenty of choice.',description:'Discover Plentovo Algeria. Everyday finds for home, kitchen and more.',robots:{index:false,follow:false},icons:{icon:'/algeria/favicon.svg'}};
export default async function Layout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){
 const {locale}=await params;if(!locales.includes(locale as Locale))notFound();
 return children
}

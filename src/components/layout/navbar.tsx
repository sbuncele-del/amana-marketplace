'use client';
import {SharedHeader} from '../../../packages/storefront/header';
import Link from 'next/link';
import {DeliveryLocation,useDelivery} from '@/contexts/delivery-context';
import {BrandLogo} from '@/components/brand-logo';
import {useSession} from 'next-auth/react';
import {MapPin,UserRound} from 'lucide-react';
import {useCart} from '@/contexts/cart-context';
import departments from '@/data/departments.json';
const quickLinks=[{name:'All products',href:'/browse'},{name:'Kitchen & Dining',href:'/department/kitchen-dining'},{name:'Electronics',href:'/department/electronics'},{name:'Kids, Toys & Baby',href:'/department/toys-kids-baby'},{name:'Health & Beauty',href:'/department/health-beauty'},{name:'Under R300',href:'/browse?maxPrice=300'},{name:'In stock',href:'/browse?available=true'}];
export function Navbar(){
 const {data:session}=useSession();const {open:openLocation}=useDelivery();const {itemCount}=useCart();
 return <SharedHeader market="🇿🇦 South Africa · ZAR" logo={<BrandLogo className="h-auto w-32 sm:w-44"/>} location={<><button type="button" onClick={openLocation} aria-label="Set your location" className="rounded-lg p-1 xl:hidden"><MapPin size={21}/></button><div className="hidden xl:block text-xs"><DeliveryLocation compact/></div></>} account={<Link href={session?.user?'/account':'/login'} aria-label={session?.user?'My account':'Sign in'} className="flex min-h-11 items-center gap-2 text-sm"><UserRound size={21}/><span className="hidden lg:block text-xs"><span className="block text-gray-500">{session?.user?`Hello, ${session.user.name?.split(' ')[0]||'there'}`:'Hello, sign in'}</span><span className="font-semibold">My account</span></span></Link>} itemCount={itemCount} quickLinks={quickLinks} departments={departments.map(d=>({...d,href:'/department/'+d.slug}))} topExtra={(session?.user as {role?:string})?.role==='ADMIN'?<Link href="/operations" className="hover:text-white">Operations</Link>:null} openHelp={()=>window.dispatchEvent(new Event('plentovo:open-help'))}/>;
}

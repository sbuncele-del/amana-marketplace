'use client';

import Image from 'next/image';
import Link from 'next/link';
import {useEffect,useRef} from 'react';
import {X} from 'lucide-react';
import {useCart} from '@/contexts/cart-context';
import {formatCurrency} from '@/lib/utils';

export function CartDrawer({open,onClose}:{open:boolean;onClose:()=>void}) {
 const dialog=useRef<HTMLDialogElement>(null);
 const {lines,totalAmount,removeLine,loading}=useCart();
 useEffect(()=>{
  const element=dialog.current;
  if(open&&!element?.open)element?.showModal();
  if(!open&&element?.open)element.close();
  if(!open)return;
  const overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  return()=>{document.body.style.overflow=overflow;};
 },[open]);

 return <dialog ref={dialog} aria-labelledby="cart-drawer-title" onClose={onClose}
  onClick={event=>{if(event.target===event.currentTarget)onClose();}}
  className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-sm bg-white p-0 text-[#171B20] shadow-2xl backdrop:bg-black/60">
  <div className="flex h-full flex-col">
   <header className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-5">
    <h2 id="cart-drawer-title" className="text-xl font-bold">Shopping cart</h2>
    <button type="button" onClick={onClose} className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm hover:bg-gray-100"><X size={18}/>Close</button>
   </header>
   <div className="min-h-0 flex-1 overflow-y-auto px-5">
    {loading&&<p className="py-6 text-sm text-gray-600">Checking your cart…</p>}
    {!loading&&!lines.length&&<p className="py-6 text-sm text-gray-600">Your cart is empty.</p>}
    {lines.map(({id,quantity,merchandise})=><div key={id} className="flex gap-3 border-b border-gray-100 py-5">
     <Link href={`/product/${merchandise.product.handle}`} onClick={onClose} className="relative size-16 shrink-0 rounded border border-gray-100">
      {merchandise.product.images[0]&&<Image src={merchandise.product.images[0].url} alt="" fill sizes="64px" className="object-contain p-1"/>}
     </Link>
     <div className="min-w-0 flex-1 text-sm">
      <Link href={`/product/${merchandise.product.handle}`} onClick={onClose} className="font-semibold hover:underline">{merchandise.product.title}</Link>
      <p className="mt-1 text-xs text-gray-600">{merchandise.title}</p>
      <p className="mt-2 text-gray-700">{quantity} × {formatCurrency(Number(merchandise.price.amount),'ZAR')}</p>
     </div>
     <button type="button" onClick={()=>void removeLine(id)} aria-label={`Remove ${merchandise.product.title}`} className="self-start rounded p-2 hover:bg-gray-100"><X size={16}/></button>
    </div>)}
   </div>
   {lines.length>0&&<div className="space-y-3 border-t border-gray-200 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
    <div className="mb-4 flex justify-between text-lg font-bold"><span>Subtotal</span><span>{formatCurrency(Number(totalAmount?.amount??0),'ZAR')}</span></div>
    <Link onClick={onClose} href="/cart" className="block rounded-full bg-gray-100 px-4 py-3 text-center text-sm font-bold">View basket</Link>
    <Link onClick={onClose} href="/checkout" className="block rounded-full bg-[#c9232a] px-4 py-3 text-center text-sm font-bold text-white">Checkout</Link>
   </div>}
  </div>
 </dialog>;
}

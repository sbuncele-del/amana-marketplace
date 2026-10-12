'use client';
import Link from 'next/link';
import {useCart} from '@/contexts/cart-context';
import {formatCurrency} from '@/lib/utils';
export default function CartPage(){
 const {lines,totalAmount,removeLine,loading}=useCart();
 const number=(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER||'').replace(/\D/g,'');
 const text=['Hello Amana, please confirm this order:',...lines.map(l=>`${l.quantity} × ${l.merchandise.product.title} (${l.merchandise.title}) — ${formatCurrency(Number(l.merchandise.price.amount)*l.quantity,'ZAR')}`),`Item subtotal: ${formatCurrency(Number(totalAmount?.amount||0),'ZAR')}`,'Please confirm stock, exact model, warranty, delivery cost and payment instructions.'].join('\n');
 return <main className="mx-auto max-w-3xl px-4 pb-20 pt-28"><h1 className="text-3xl font-bold">Your order enquiry</h1><p className="mt-3 text-gray-600">Confirm your items with Amana before payment. Delivery is quoted separately.</p>
 {loading?<p className="mt-8">Loading your items…</p>:!lines.length?<div className="mt-8"><p>No items selected yet.</p><Link href="/browse" className="mt-4 inline-block font-semibold text-amber-700">Browse air fryers →</Link></div>:<>
 <div className="mt-8 space-y-4">{lines.map(l=><article key={l.id} className="rounded-xl border bg-white p-5"><Link href={`/product/${l.merchandise.product.handle}`} className="font-bold">{l.merchandise.product.title}</Link><p className="mt-2 text-sm text-gray-600">{l.merchandise.title} · Quantity {l.quantity}</p><p className="mt-2 font-semibold">{formatCurrency(Number(l.merchandise.price.amount)*l.quantity,'ZAR')}</p><button onClick={()=>removeLine(l.id)} className="mt-2 text-sm text-red-700 underline">Remove item</button></article>)}</div>
 <p className="mt-6 text-xl font-bold">Item subtotal: {formatCurrency(Number(totalAmount?.amount||0),'ZAR')}</p><p className="mt-2 text-sm text-gray-500">No payment has been taken. We will confirm the final total first.</p>
 {number?<a href={`https://wa.me/${number}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block rounded-xl bg-green-700 px-6 py-4 font-bold text-white">Send order enquiry on WhatsApp</a>:<Link href="/contact" className="mt-6 inline-block rounded-xl bg-[#D4A843] px-6 py-4 font-bold">Contact Amana to confirm this order</Link>}
 <p className="mt-4 text-sm text-gray-600">Opening WhatsApp prepares a message. You review and send it yourself.</p></>}
 </main>;
}

'use client';
import {DeliveryOptions} from '@/components/delivery-options';
import {deliveryFee} from '@/lib/delivery-rates';
import {useSession} from 'next-auth/react';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {useCart} from '@/contexts/cart-context';
import {useDelivery,DeliveryLocation} from '@/contexts/delivery-context';
import {formatCurrency} from '@/lib/utils';
import {MapPin,Truck,CreditCard} from 'lucide-react';
export default function CheckoutPage(){const {data:session,status}=useSession();const {lines,totalAmount,loading,deliveryMethod,clearCart}=useCart();const shipping=deliveryFee(lines,deliveryMethod);const {address,open,addAddress}=useDelivery();const total=formatCurrency(Number(totalAmount?.amount||0),'ZAR');
 const router=useRouter();
 const needsAddress=deliveryMethod==='DELIVERY'&&!address;
 const [busy,setBusy]=useState(false);
 const [ozowReady,setOzowReady]=useState(false);
 const [payMethod,setPayMethod]=useState<'EFT'|'OZOW'>('EFT');
 useEffect(()=>{fetch('/api/checkout/ozow').then(r=>r.json()).then(r=>{if(r?.enabled){setOzowReady(true);setPayMethod('OZOW');}}).catch(()=>{});},[]);
 const ozow=ozowReady&&payMethod==='OZOW';
 const actionHint=busy?'We’re checking availability and saving your order.':!session?.user?'Sign in so we can save your order and send your payment instructions.':needsAddress?'Add your delivery address or choose free collection to continue.':'Your bank details and payment reference will appear after you place the order.';
 const [error,setError]=useState('');
 const submitting=useRef(false);
 async function placeOrder(){
  if(submitting.current || shipping===null || !session?.user || (deliveryMethod==='DELIVERY'&&!address))return;
  submitting.current=true;
  setBusy(true);
  setError('');
  try {
   const details={addressId:deliveryMethod==='DELIVERY'?address?.id??null:null,method:deliveryMethod,
    totalCents:Math.round((Number(totalAmount?.amount||0)+shipping)*100),
    lines:lines.map(({id,quantity})=>({id,quantity}))};
   const storageKey=ozow?'plentovo-ozow-checkout':'plentovo-eft-checkout';
   const signature=JSON.stringify({userId:session.user.id,...details});
   const previous=JSON.parse(sessionStorage.getItem(storageKey)||'null');
   const requestKey=previous?.signature===signature?previous.requestKey:crypto.randomUUID();
   sessionStorage.setItem(storageKey,JSON.stringify({signature,requestKey}));
   const response=await fetch(ozow?'/api/checkout/ozow':'/api/checkout/eft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...details,requestKey})});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error);
   if(ozow){
    if(result.redirectUrl){window.location.assign(result.redirectUrl);return;}
    router.push(`/checkout/ozow/${result.reference}`);return;
   }
   router.push(`/checkout/eft/${result.reference}`);
   clearCart();
   sessionStorage.removeItem(storageKey);
  }catch(e){
   setError(e instanceof Error?e.message:'Please retry checkout.');
   submitting.current=false;
   setBusy(false);
  }
 }

 return <main id="main-content" className="mx-auto max-w-6xl px-4 py-8"><Link href="/cart" className="text-sm font-semibold text-red-700">← Back to cart</Link><h1 className="mt-5 text-3xl font-bold">Checkout</h1><ol className="my-6 flex flex-wrap gap-4 text-xs font-semibold"><li className="text-red-700">1 · Account</li><li>2 · Delivery address</li><li>3 · Delivery options</li><li>4 · Payment</li></ol>{loading||status==='loading'?<p>Loading your checkout…</p>:!lines.length?<div className="rounded-xl border bg-white p-8"><h2 className="text-xl font-bold">Your cart is empty</h2><Link href="/browse" className="mt-4 inline-block text-red-700 underline">Continue shopping</Link></div>:<div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]"><div className="space-y-5"><section className="rounded-xl border bg-white p-6"><h2 className="text-lg font-bold">Your account</h2>{session?.user?<p className="mt-3 text-sm">Signed in as {session.user.email}</p>:<><p className="mt-3 text-sm text-gray-500">Sign in or create an account to use your saved addresses and keep your orders together.</p><button onClick={()=>open()} className="mt-5 rounded-lg bg-[#DA292B] px-6 py-3 text-sm font-bold">Sign in to continue</button></>}</section>{deliveryMethod==='DELIVERY'&&<section className="rounded-xl border bg-white p-6"><h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><MapPin size={20}/>Delivery address</h2><DeliveryLocation/>{address&&<div className="mt-4 text-sm leading-6"><strong>{address.fullName}</strong><p>{address.street}</p><p>{address.city}, {address.state}, {address.zip}</p><p>{address.phone}</p></div>}</section>}<section className="rounded-xl border bg-white p-6"><h2 className="flex items-center gap-2 text-lg font-bold"><Truck size={20}/>Delivery options</h2><DeliveryOptions/></section><section className="rounded-xl border bg-white p-6"><h2 className="flex items-center gap-2 text-lg font-bold"><CreditCard size={20}/>Payment</h2>{ozowReady&&<div className="mt-4 space-y-3 text-sm"><label className="flex items-start gap-3"><input type="radio" name="pay" checked={payMethod==='OZOW'} onChange={()=>setPayMethod('OZOW')} className="mt-1"/><span><strong>Pay by Bank (Ozow)</strong><span className="block text-gray-500">Pay instantly from your own banking app. You’ll be taken to Ozow’s secure page and brought back here.</span></span></label><label className="flex items-start gap-3"><input type="radio" name="pay" checked={payMethod==='EFT'} onChange={()=>setPayMethod('EFT')} className="mt-1"/><span><strong>Manual EFT</strong><span className="block text-gray-500">Transfer to our Standard Bank business account. Your order is released once the payment clears.</span></span></label></div>}{!ozow&&<p className="mt-3 text-sm text-gray-500">Pay by EFT to our Standard Bank business account. You’ll receive the banking details and your order reference after placing the order.</p>}</section></div><aside className="rounded-xl border bg-white p-6"><h2 className="text-lg font-bold">Order summary</h2><div className="mt-5 space-y-4">{lines.map(l=><div key={l.id} className="text-sm"><p className="font-semibold">{l.merchandise.product.title}</p><div className="mt-1 flex justify-between gap-3 text-xs text-gray-500"><span>{l.quantity} × {l.merchandise.title}</span><span>{formatCurrency(Number(l.merchandise.price.amount)*l.quantity,'ZAR')}</span></div></div>)}</div><div className="mt-5 flex justify-between border-t pt-4 text-sm"><span>Item subtotal</span><strong>{total}</strong></div><div className="mt-3 flex justify-between text-sm text-gray-500"><span>{deliveryMethod==='COLLECTION'?'Collection':'Delivery'}</span><span>{shipping===null?'To be confirmed':shipping===0?'Free':formatCurrency(shipping,'ZAR')}</span></div>{shipping!==null&&<div className="mt-5 flex justify-between border-t pt-4 font-bold"><span>Order total</span><span>{formatCurrency(Number(totalAmount?.amount||0)+shipping,'ZAR')}</span></div>}{!session?.user||needsAddress||shipping!==null?<button type="button" onClick={()=>{if(!session?.user)open();else if(needsAddress)addAddress();else void placeOrder();}} disabled={busy} aria-describedby="checkout-next-step" className="mt-6 w-full rounded-lg bg-[#DA292B] py-3 font-bold text-white disabled:bg-gray-200 disabled:text-gray-500">{busy?(ozow?'Opening Ozow…':'Placing order…'):!session?.user?'Sign in to continue':needsAddress?'Add delivery address':ozow?'Pay by Bank':'Place EFT order'}</button>:null}{(!session?.user||needsAddress||shipping!==null)&&<p id="checkout-next-step" role="status" className="mt-3 text-sm text-gray-600">{actionHint}</p>}{session?.user&&!needsAddress&&shipping===null&&<p className="mt-5 text-sm text-gray-600">We need to confirm delivery for this cart. <Link href="/contact" className="font-semibold text-red-700 underline">Ask for a delivery quote</Link> or choose free collection.</p>}{error&&<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}</aside></div>}</main>;
}

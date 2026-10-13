'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Truck, CheckCircle, ArrowRight } from 'lucide-react';
import type { CatalogueProduct } from '@/lib/catalogue';
import { useCart } from '@/contexts/cart-context';
import { formatCurrency } from '@/lib/utils';
export default function ProductPageClient({product}: {product: CatalogueProduct}) {
  const [colour,setColour] = useState(product.colours[0]);
  const [selectedImage,setSelectedImage] = useState(0);
  const [quantity,setQuantity] = useState(1);
  const {addToCart} = useCart();
  const [error,setError] = useState('');
  async function enquire() {
    try { const {checkoutUrl} = await addToCart(`${product.id}:${product.variants.find(v=>v.title===colour)?.id}`,quantity); window.location.href = checkoutUrl; }
    catch {setError('Unable to add this item. Please try again.');}
  }
  const selectedVariant=product.variants.find(v=>v.title===colour) ?? product.variants[0];
  const price=selectedVariant.price;
  return <main className="mx-auto max-w-6xl px-4 pb-20 pt-28">
    <nav className="mb-6 text-sm text-gray-500"><Link href="/browse">Shop</Link> / Kitchen & Dining / {product.name}</nav>
    <div className="grid gap-10 lg:grid-cols-2">
      <div><div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50"><Image src={product.images[selectedImage]} alt={`${product.name} — supplier product image`} fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-contain" /></div>
        <div className="mt-3 flex gap-3">{product.images.map((src,i)=><button key={src} aria-label={`View product image ${i+1}`} aria-pressed={i===selectedImage} onClick={()=>setSelectedImage(i)} className="relative h-20 w-20 overflow-hidden rounded-lg border"><Image src={src} alt="" fill sizes="80px" className="object-contain" /></button>)}</div>
        <p className="mt-3 text-xs text-gray-500">Product images supplied by our fulfilment partner.</p>
      </div>
      <div><p className="text-sm font-semibold text-amber-700">AMANA · HOME & KITCHEN</p><h1 className="mt-3 text-3xl font-extrabold">{product.name}</h1>
        <p className="mt-5 text-3xl font-bold">{formatCurrency(price,'ZAR')}</p><p className="mt-1 text-sm text-gray-500">Delivery quoted separately before payment.</p>
        <p className="mt-5 leading-relaxed text-gray-600">{product.description}</p>
        <fieldset className="mt-6"><legend className="mb-2 font-semibold">Choose an option</legend><div className="flex gap-2">{product.colours.map(c=><button type="button" key={c} aria-pressed={colour===c} onClick={()=>setColour(c)} className={`rounded-lg border px-5 py-2 ${colour===c?'border-amber-600 bg-amber-50':'border-gray-200'}`}>{c}</button>)}</div></fieldset>
        <label className="mt-5 block font-semibold" htmlFor="quantity">Quantity</label><input id="quantity" type="number" min={1} max={10} value={quantity} onChange={e=>setQuantity(Math.max(1,Math.min(10,Number(e.target.value)||1)))} className="mt-2 w-24 rounded-lg border px-3 py-2" />
        <button onClick={enquire} disabled={!selectedVariant.supplierAvailable} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4A843] px-5 py-4 font-bold text-[#1A1A2E] disabled:opacity-50">{selectedVariant.supplierAvailable ? "Request this order" : "Currently unavailable"} <ArrowRight size={18}/></button>
        <p className="mt-3 text-sm text-gray-600">Your order enquiry goes to Amana. We provide the delivered total and payment instructions. No payment is taken on this page.</p>
        {error && <p role="alert" className="mt-3 text-red-600">{error}</p>}
        <div className="mt-6 space-y-3 rounded-xl bg-gray-50 p-5"><p className="flex gap-2 text-sm"><CheckCircle size={18}/>Local supplier fulfilment in South Africa</p><p className="flex gap-2 text-sm"><Truck size={18}/>{product.deliveryNote}</p></div>
        <p className="mt-3 text-sm font-semibold">{selectedVariant.supplierAvailable ? "In stock" : "Currently unavailable"}</p><h2 className="mt-7 font-bold">Product details</h2><p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">{product.details}</p><ul className="mt-3 list-disc space-y-2 pl-5 text-gray-600">{product.specifications.map(s=><li key={s}>{s}</li>)}</ul>
      </div>
    </div>
  </main>;
}

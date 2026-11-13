'use client';
import {useCart} from '@/contexts/cart-context';
import {deliveryFee} from '@/lib/delivery-rates';
import {formatCurrency} from '@/lib/utils';
export function DeliveryOptions() {
 const {lines}=useCart();
 const fee=deliveryFee(lines,'DELIVERY');
 return <div className="mt-4 space-y-3"><div className="rounded-xl border border-gray-200 p-4">
 <div className="flex justify-between gap-3 text-sm font-bold"><span>Deliver to my address</span><span>{fee===null?'Quote required':formatCurrency(fee,'ZAR')}</span></div>
 <p className="mt-1 text-xs leading-5 text-gray-500">0–2 business days processing, then 3–5 business days in transit. South Africa only.</p>
 {fee===null&&<p className="mt-1 text-xs text-red-700">Contact us for a delivery quote before ordering.</p>}
 </div><details className="text-xs text-gray-500"><summary className="cursor-pointer font-semibold">Delivery information</summary><div className="mt-3 space-y-2"><p className="pt-3 leading-5">Order cut-off: 14:00 SAST. Business days exclude weekends and public holidays. Deliveries require a physical address; PO Boxes are not supported. Tracking follows dispatch. Contact Plentovo if your delivery is delayed or missing.</p></div></details></div>;}

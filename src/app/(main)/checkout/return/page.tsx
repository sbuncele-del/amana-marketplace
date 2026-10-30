import Link from 'next/link';
import {ClearCart} from '../clear-cart';

export const metadata = {title: 'Confirming your payment', robots: {index: false}};

// Payfast sends the customer back here. This page never claims the order is paid: only Payfast's notification does.
export default async function ReturnPage({searchParams}: {searchParams: Promise<{ref?: string}>}) {
  const ref = ((await searchParams).ref ?? '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 40);
  return <main id="main-content" className="mx-auto max-w-xl px-4 py-16 text-center"><ClearCart/>
    <h1 className="text-3xl font-bold">Thank you</h1>
    <p className="mt-4 text-gray-600">We are confirming your payment with Payfast. This usually takes a few moments.</p>
    {ref && <p className="mt-4 text-sm">Your order reference is <strong>{ref}</strong>. Please quote it if you contact us.</p>}
    <Link href="/browse" className="mt-8 inline-block font-semibold text-red-700 underline">Continue shopping</Link></main>;
}

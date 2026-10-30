import Link from 'next/link';

export const metadata = {title: 'Payment cancelled', robots: {index: false}};

export default function CancelledPage() {
  return <main id="main-content" className="mx-auto max-w-xl px-4 py-16 text-center">
    <h1 className="text-3xl font-bold">Payment cancelled</h1>
    <p className="mt-4 text-gray-600">You were not charged. Your cart is still here whenever you are ready.</p>
    <Link href="/checkout" className="mt-8 inline-block rounded-lg bg-[#DA292B] px-6 py-3 text-sm font-bold">Back to checkout</Link></main>;
}

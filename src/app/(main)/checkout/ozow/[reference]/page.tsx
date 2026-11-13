import Link from 'next/link';
import {notFound, redirect} from 'next/navigation';
import {auth} from '@/lib/auth';
import {ensureExperienceSchema, experiencePool} from '@/lib/experience/store';
import {formatCurrency} from '@/lib/utils';
import {AutoRefresh, ClearCartWhenPaid} from './auto-refresh';

export const metadata = {title: 'Payment | Plentovo', robots: {index: false, follow: false}};
export const dynamic = 'force-dynamic';

// The customer lands here after Ozow. The browser return is NOT proof of payment: this page only
// shows what the verified webhook has recorded.
export default async function OzowReturnPage({params}: {params: Promise<{reference: string}>}) {
  const {reference} = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent('/checkout/ozow/' + reference)}`);
  await ensureExperienceSchema();
  const {rows: [order]} = await experiencePool().query(
    "SELECT status,data FROM experience_records WHERE kind='ORDER' AND reference=$1 AND data->>'customerId'=$2 AND data->>'paymentMethod'='OZOW'",
    [reference, session.user.id],
  );
  if (!order) notFound();
  const pending = order.status === 'CONFIRMED';
  const cancelled = order.status === 'CANCELLED';
  const amount = formatCurrency((order.data.subtotalCents + (order.data.shippingCents ?? 0)) / 100, 'ZAR');
  return <main id="main-content" className="mx-auto max-w-2xl space-y-6 px-4 py-10">
    <h1 className="text-3xl font-bold">{pending ? 'Confirming your payment' : cancelled ? 'Order cancelled' : 'Payment confirmed'}</h1>
    <section className="space-y-3 rounded-xl border bg-white p-6">
      <p className="font-semibold">Order {reference}</p>
      <p className="border-t pt-3 font-bold">Total {amount}</p>
      {pending ? <>
        <p className="text-sm text-gray-600">We’re waiting for your bank to confirm the payment. This usually takes under a minute. If you cancelled or the payment failed, nothing was charged and you can try again from your cart.</p>
        <AutoRefresh />
      </> : cancelled ? <p className="text-sm text-gray-600">This order was cancelled. Contact Plentovo if you were charged.</p>
      : <><ClearCartWhenPaid /><p className="text-sm text-gray-600">Thank you. We’ll get your order ready and email you when it’s on its way.</p></>}
    </section>
    <Link href="/browse" className="text-sm font-semibold text-red-700">Continue shopping</Link>
  </main>;
}

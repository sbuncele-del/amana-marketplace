import Link from 'next/link';
import {notFound, redirect} from 'next/navigation';
import {auth} from '@/lib/auth';
import {eftBankDetails} from '@/lib/eft';
import {ensureExperienceSchema, experiencePool} from '@/lib/experience/store';
import {formatCurrency} from '@/lib/utils';

export const metadata = {title: 'EFT order | Plentovo', robots: {index: false, follow: false}};

export default async function EftOrderPage({params}: {params: Promise<{reference: string}>}) {
  const {reference} = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=${encodeURIComponent('/checkout/eft/' + reference)}`);
  await ensureExperienceSchema();
  const {rows: [order]} = await experiencePool().query(
    "SELECT status,data FROM experience_records WHERE kind='ORDER' AND reference=$1 AND data->>'customerId'=$2 AND data->>'paymentMethod'='EFT'",
    [reference, session.user.id],
  );
  if (!order) notFound();
  const pending = order.status === 'CONFIRMED';
  const cancelled = order.status === 'CANCELLED';
  const bank = pending ? eftBankDetails() : null;
  const amount = formatCurrency((order.data.subtotalCents + order.data.shippingCents) / 100, 'ZAR');
  const items = order.data.items as {id: string; name: string; option: string; quantity: number}[];
  return <main id="main-content" className="mx-auto max-w-2xl space-y-6 px-4 py-10">
    <h1 className="text-3xl font-bold">{pending ? 'Order received' : cancelled ? 'Order cancelled' : 'Payment confirmed'}</h1>
    <section className="space-y-3 rounded-xl border bg-white p-6">
      <p className="font-semibold">Order {reference}</p>
      <ul className="space-y-2 text-sm">{items.map(item => <li key={item.id}>{item.quantity} × {item.name}{item.option === 'Standard' ? '' : ` · ${item.option}`}</li>)}</ul>
      <p className="border-t pt-3 font-bold">Total {amount}</p>
    </section>
    {pending && <section className="space-y-3 rounded-xl border bg-white p-6">
      <h2 className="text-xl font-bold">Awaiting EFT payment</h2>
      {bank ? <>
        <p className="text-sm">Transfer {amount} using <strong>{reference}</strong> as the beneficiary reference.</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt>Bank</dt><dd>{bank.bank}</dd>
          <dt>Account holder</dt><dd>{bank.holder}</dd>
          <dt>Account type</dt><dd>{bank.type}</dd>
          <dt>Account number</dt><dd className="font-mono">{bank.accountNumber}</dd>
          <dt>Branch code</dt><dd className="font-mono">{bank.branchCode}</dd>
        </dl>
        <p className="text-sm">We’ll process your order after we verify that the funds have cleared. If you’ve already transferred the money, allow time for verification.</p>
      </> : <p>Contact Plentovo for payment instructions and quote your order reference.</p>}
    </section>}
    <Link href="/browse" className="text-sm font-semibold text-red-700 underline">Continue shopping</Link>
  </main>;
}

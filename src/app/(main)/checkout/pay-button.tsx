'use client';
import {useEffect, useRef, useState} from 'react';

type Line = {id: string; quantity: number};

// Asks the server to price the cart and sign the Payfast form, then hands the browser to Payfast.
export function PayButton({lines, deliveryMethod, addressId, ready}: {lines: Line[]; deliveryMethod: 'DELIVERY' | 'COLLECTION'; addressId: string | null; ready: boolean}) {
  const [enabled, setEnabled] = useState<boolean | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const key = useRef(''), form = useRef<HTMLFormElement>(null), [post, setPost] = useState<{action: string; fields: [string, string][]} | null>(null);
  useEffect(() => { key.current = crypto.randomUUID(); fetch('/api/checkout/payfast', {cache: 'no-store'}).then(r => r.json()).then(d => setEnabled(!!d.enabled)).catch(() => setEnabled(false)); }, []);
  useEffect(() => { if (post) form.current?.submit(); }, [post]);
  if (enabled === false) return <p className="mt-3 text-sm text-gray-500">Online payment is not available yet. You can keep shopping and save your delivery address; your cart stays here.</p>;
  async function pay() {
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/checkout/payfast', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({lines: lines.map(({id, quantity}) => ({id, quantity})), deliveryMethod, addressId, checkoutKey: key.current})});
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'We could not start your payment.');
      setPost(d);
    } catch (e) { setError(e instanceof Error ? e.message : 'We could not start your payment.'); setBusy(false); }
  }
  return <div className="mt-3"><p className="text-sm text-gray-600">You will pay securely on Payfast. Card and instant EFT are shown there.</p>
    <button type="button" onClick={pay} disabled={!ready || busy || enabled === null} className="mt-5 w-full rounded-lg bg-[#DA292B] py-3.5 text-sm font-bold disabled:bg-gray-200 disabled:text-gray-500">{busy ? 'Taking you to Payfast…' : 'Pay with Payfast'}</button>
    {!ready && <p className="mt-2 text-xs text-gray-500">Sign in and choose your address{' '}to pay.</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {post && <form ref={form} method="post" action={post.action} className="hidden">{post.fields.map(([k, v]) => <input key={k} type="hidden" name={k} value={v}/>)}</form>}</div>;
}

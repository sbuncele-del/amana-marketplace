'use client';
import {useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import {Banknote} from 'lucide-react';
import {codCopy} from '@/lib/cod-copy';
import {governorates} from '@/lib/orders/cod';
import {money, type Locale} from '@/lib/catalogue';

type Line = {id: string; quantity: number};

// Cash-on-delivery checkout. The server re-prices everything; the total shown here is only a preview.
export function CodCheckout({locale, t, cart, total, unresolved, onPlaced, shopHref}: {locale: Locale; t: Record<string, string>; cart: Line[]; total: number; unresolved: boolean; onPlaced: () => void; shopHref: string}) {
  const c = codCopy[locale], key = useRef(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [field, setField] = useState(''), [done, setDone] = useState<string | null>(null);
  useEffect(() => { key.current = crypto.randomUUID(); }, []);
  if (done) return <section className="page"><h1>{c.done}</h1><div className="notice" role="status"><p>{c.doneText}</p><p>{c.ref}: <strong dir="ltr">{done}</strong></p></div><Link prefetch={false} className="button" href={shopHref}>{c.keep}</Link></section>;
  if (!cart.length) return <section className="page"><h1>{t.checkoutTitle}</h1><p>{c.empty}</p><Link prefetch={false} className="button" href={shopHref}>{c.keep}</Link></section>;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(''); setField('');
    const f = new FormData(e.currentTarget), get = (n: string) => String(f.get(n) ?? '');
    try {
      const r = await fetch('/tunisia/api/orders', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({requestKey: key.current, locale, name: get('name'), phone: get('phone'), governorate: get('governorate'), delegation: get('delegation'), address: get('address'), notes: get('notes'), website: get('website'), lines: cart})});
      const d = await r.json().catch(() => ({}));
      if (r.status === 201) { onPlaced(); setDone(d.reference); return; }
      setField(d.field ?? '');
      setError(d.code === 'INVALID_DETAILS' ? c.invalid : d.code === 'OUT_OF_STOCK' ? c.soldOut : d.code === 'INVALID_CART' ? c.cart : d.code === 'RATE_LIMITED' ? c.limit : c.busy);
    } catch { setError(c.busy); }
    setBusy(false);
  }
  const mark = (n: string) => (field === n ? {'aria-invalid': true as const} : {});
  return <section className="page"><h1>{t.checkoutTitle}</h1><p>{c.how}</p>
    <div className="checkout-grid"><form onSubmit={submit} className="address-form">
      <label>{t.name}<input required minLength={2} maxLength={100} autoComplete="name" name="name" {...mark('name')}/></label>
      <label>{t.phone}<input required type="tel" dir="ltr" inputMode="tel" autoComplete="tel" name="phone" placeholder="98 123 456" {...mark('phone')}/><small>{c.phoneHelp}</small></label>
      <div className="field-pair"><label>{t.governorate}<select required name="governorate" defaultValue="" {...mark('governorate')}><option value="" disabled>{c.choose}</option>{governorates.map(g => <option key={g}>{g}</option>)}</select></label>
      <label>{t.delegation}<input required minLength={2} maxLength={80} name="delegation" {...mark('delegation')}/></label></div>
      <label>{t.address}<textarea required minLength={5} maxLength={300} autoComplete="street-address" name="address" {...mark('address')}/></label>
      <label>{t.notes}<textarea maxLength={300} name="notes"/></label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{position: 'absolute', left: '-9999px', height: 0, width: 0, opacity: 0}}/>
      <p>{c.call}</p>
      {error && <p role="alert" style={{color: '#b91c1c'}}>{error}</p>}
      <button className="button" disabled={busy || unresolved}>{busy ? c.placing : c.place}</button></form>
    <aside className="summary"><Banknote/><h2>{t.cod}</h2><p>{t.codText}</p><hr/><p>{t.subtotal}</p>{unresolved ? <p role="status">{c.cart}</p> : <strong>{money(total, locale)}</strong>}<p>{c.deliveryFee}</p></aside></div></section>;
}

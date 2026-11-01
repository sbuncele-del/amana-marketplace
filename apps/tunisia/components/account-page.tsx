'use client';
import {useCallback, useEffect, useState} from 'react';
import Link from 'next/link';
import {accountCopy} from '@/lib/account/copy';
import {governorates} from '@/lib/orders/cod';
import {money, type Locale} from '@/lib/catalogue';

type Customer = {id: string; email: string; name: string; phone: string; governorate: string; delegation: string; address: string};
type Order = {reference: string; status: keyof typeof accountCopy.en.stages; items: {title: string; quantity: number}[]; totalMillimes: number; createdAt: string};
const api = (action: string, body?: unknown) => fetch(`/tunisia/api/account/${action}`, body === undefined ? {cache: 'no-store'} : {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});

// Optional account: sign in with an emailed code, see orders, keep saved details. Also a guest order lookup.
export function AccountPage({locale, privacyHref, trackOnly = false}: {locale: Locale; privacyHref: string; trackOnly?: boolean}) {
  const c = accountCopy[locale];
  const [state, setState] = useState<'loading' | 'out' | 'in' | 'closed'>('loading');
  const [customer, setCustomer] = useState<Customer | null>(null), [orders, setOrders] = useState<Order[]>([]);
  const [email, setEmail] = useState(''), [consent, setConsent] = useState(false), [code, setCode] = useState(''), [sent, setSent] = useState(false), [busy, setBusy] = useState(false), [msg, setMsg] = useState('');
  const [saved, setSaved] = useState(''), [confirmDelete, setConfirmDelete] = useState(false);
  const [trackRef, setTrackRef] = useState(''), [trackPhone, setTrackPhone] = useState(''), [tracked, setTracked] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api('me');
      if (r.status === 503) { setState('closed'); return; }
      if (r.status === 401) { setState('out'); return; }
      const d = await r.json(); setCustomer(d.customer); setOrders(d.orders); setState('in');
    } catch { setState('out'); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault(); setMsg('');
    if (!consent) { setMsg(c.consentNeeded); return; }
    setBusy(true);
    try {
      const r = await api('code', {email, locale, consent: true}), d = await r.json().catch(() => ({}));
      if (r.ok) setSent(true); else setMsg(d.code === 'INVALID_EMAIL' ? c.invalidEmail : d.code === 'WAIT' ? c.wait(d.seconds) : d.code === 'ACCOUNTS_NOT_OPEN' ? c.closed : c.unavailable);
    } catch { setMsg(c.unavailable); }
    setBusy(false);
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault(); setMsg(''); setBusy(true);
    try {
      const r = await api('verify', {email, code, locale}), d = await r.json().catch(() => ({}));
      if (r.ok) { setCustomer(d.customer); setOrders(d.orders); setState('in'); setCode(''); setSent(false); } else setMsg(r.status === 401 ? c.wrongCode : c.unavailable);
    } catch { setMsg(c.unavailable); }
    setBusy(false);
  }
  async function saveDetails(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaved('');
    const f = new FormData(e.currentTarget), get = (n: string) => String(f.get(n) ?? '');
    const r = await api('profile', {name: get('name'), phone: get('phone'), governorate: get('governorate'), delegation: get('delegation'), address: get('address')});
    setSaved(r.ok ? c.saved : c.invalidDetails);
  }
  async function signOut() { await api('logout', {}); setCustomer(null); setOrders([]); setState('out'); }
  async function remove() { await api('delete', {confirm: true}); setCustomer(null); setOrders([]); setConfirmDelete(false); setState('out'); }
  async function track(e: React.FormEvent) {
    e.preventDefault(); setTracked(null);
    const r = await api('track', {reference: trackRef, phone: trackPhone}), d = await r.json().catch(() => ({}));
    setTracked(r.ok ? c.stages[d.status as keyof typeof c.stages] : '');
  }

  const trackBox = <section aria-label={c.trackTitle} style={{marginTop: 32}}><h2>{c.trackTitle}</h2><p>{c.trackIntro}</p>
    <form onSubmit={track} className="address-form" style={{maxWidth: 420}}>
      <label>{c.trackRef}<input required dir="ltr" value={trackRef} onChange={e => setTrackRef(e.target.value)} maxLength={20}/></label>
      <label>{c.trackPhone}<input required type="tel" dir="ltr" value={trackPhone} onChange={e => setTrackPhone(e.target.value)} placeholder="98 123 456"/></label>
      <button className="button">{c.trackButton}</button></form>
    {tracked !== null && (tracked ? <p role="status"><strong>{c.trackStatus}: {tracked}</strong></p> : <p role="alert" style={{color: '#b91c1c'}}>{c.trackNone}</p>)}</section>;

  if (state === 'loading') return <section className="page"><h1>{c.title}</h1></section>;
  if (state === 'closed') return <section className="page"><h1>{c.title}</h1><p>{c.closed}</p>{trackBox}</section>;
  if (state === 'out') return <section className="page"><h1>{trackOnly ? c.trackTitle : c.title}</h1><p>{c.intro}</p>
    <form onSubmit={sent ? verify : sendCode} className="address-form" style={{maxWidth: 420}}>
      <label>{c.email}<input required type="email" dir="ltr" autoComplete="email" inputMode="email" maxLength={120} value={email} onChange={e => setEmail(e.target.value)} disabled={sent}/></label>
      {!sent && <label style={{display: 'flex', gap: 10, alignItems: 'flex-start', fontWeight: 400}}><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{width: 'auto', marginTop: 4}}/><span>{c.consent} <Link href={privacyHref}>{c.privacy}</Link></span></label>}
      {sent && <><p role="status">{c.codeSent(email)}</p><label>{c.code}<input required dir="ltr" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}/></label></>}
      {msg && <p role="alert" style={{color: '#b91c1c'}}>{msg}</p>}
      <button className="button" disabled={busy}>{busy ? (sent ? c.checking : c.sending) : sent ? c.signIn : c.sendCode}</button></form>
    {trackBox}</section>;

  return <section className="page"><h1>{trackOnly ? c.orders : c.title}</h1><p dir="ltr" style={{textAlign: locale === 'ar' ? 'right' : 'left'}}>{customer?.email}</p>
    <h2>{c.orders}</h2>
    {!orders.length ? <p>{c.noOrders}</p> : <div style={{display: 'grid', gap: 12}}>{orders.map(o => <div key={o.reference} className="cart-row" style={{flexDirection: 'column', gap: 6}}>
      <div style={{display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap'}}><strong dir="ltr">{c.reference} {o.reference}</strong><strong>{c.stages[o.status]}</strong></div>
      <span style={{color: '#6b7280', fontSize: 13}}>{new Date(o.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-TN' : locale === 'fr' ? 'fr-TN' : 'en-GB')}</span>
      <span style={{fontSize: 14}}>{o.items.map(i => `${i.quantity} × ${i.title}`).join(' · ')}</span>
      <span>{c.total}: <strong>{money(o.totalMillimes, locale)}</strong></span></div>)}</div>}
    {!trackOnly && customer && <><h2 style={{marginTop: 32}}>{c.details}</h2>
      <form onSubmit={saveDetails} className="address-form" style={{maxWidth: 520}} key={customer.id}>
        <label>{c.name}<input name="name" maxLength={100} defaultValue={customer.name} autoComplete="name"/></label>
        <label>{c.phone}<input name="phone" type="tel" dir="ltr" defaultValue={customer.phone} autoComplete="tel" placeholder="98 123 456"/></label>
        <div className="field-pair"><label>{c.governorate}<select name="governorate" defaultValue={customer.governorate}><option value="">{c.choose}</option>{governorates.map(g => <option key={g}>{g}</option>)}</select></label>
        <label>{c.delegation}<input name="delegation" maxLength={80} defaultValue={customer.delegation}/></label></div>
        <label>{c.address}<textarea name="address" maxLength={300} defaultValue={customer.address} autoComplete="street-address"/></label>
        {saved && <p role="status">{saved}</p>}
        <button className="button">{c.save}</button></form></>}
    <div style={{marginTop: 32, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center'}}>
      <button className="button" onClick={signOut}>{c.signOut}</button>
      {!confirmDelete ? <button className="text-button" onClick={() => setConfirmDelete(true)}>{c.deleteAccount}</button>
        : <div role="alertdialog" style={{flexBasis: '100%'}}><p>{c.deleteWarning}</p><button className="text-button" onClick={remove}>{c.deleteConfirm}</button></div>}</div></section>;
}

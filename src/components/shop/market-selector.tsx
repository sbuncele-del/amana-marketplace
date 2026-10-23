"use client";
import {useEffect, useRef, useState} from 'react';
type Market = {code: string; name: string; currency: string};
type LocationData = {markets: Market[]; selectedMarket: string | null; confirmed: boolean; detectedCountry: {code:string;name:string;available:boolean} | null};
export function MarketSelector() {
  const [data, setData] = useState<LocationData | null>(null);
  const [open, setOpen] = useState(false);
  const [changing, setChanging] = useState(false);
  const [choice, setChoice] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/commerce/markets', {signal: controller.signal}).then(async r => {
      if (!r.ok) throw new Error();
      const location: LocationData = await r.json();
      setData(location); setChoice(location.selectedMarket || ''); setOpen(!location.confirmed);
    }).catch(e => {if (e.name !== 'AbortError') setError('Location detection is temporarily unavailable. Please try again later.');});
    const change = () => {setChanging(true);setOpen(true);};
    window.addEventListener('plentovo:change-country', change);
    return () => {controller.abort();window.removeEventListener('plentovo:change-country', change);};
  }, []);
  useEffect(() => {
    const modal = dialog.current;
    if (open && modal && !modal.open) modal.showModal();
    if (!open && modal?.open) modal.close();
  }, [open]);
  async function choose(code: string) {
    if (!code) return;
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/commerce/markets', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({code,remember})});
      if (!r.ok) throw new Error('Could not save your country. Please try again.');
      window.location.reload();
    } catch(e) {setError(e instanceof Error ? e.message : 'Please try again.');setBusy(false);}
  }
  const current = data?.markets.find(m => m.code === data.selectedMarket);
  const detected = data?.detectedCountry;
  const suggested = data?.markets.find(m => m.code === detected?.code);
  return <>
    <div className="border-b bg-stone-50 px-4 py-2 text-center text-sm">
      <button type="button" onClick={() => {setChanging(false);setOpen(true);}} className="rounded px-2 py-1 font-semibold underline-offset-4 hover:underline">{current ? `Deliver to ${current.name} · ${current.currency}` : 'Choose delivery country'}</button>
      {!open && error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    </div>
    <dialog ref={dialog} aria-labelledby="country-title" onCancel={() => setOpen(false)} onClose={() => setOpen(false)} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl border-0 bg-white p-0 text-[#171B20] shadow-2xl backdrop:bg-black/50">
      <div className="flex items-center justify-between border-b bg-stone-50 px-6 py-4">
        <h2 id="country-title" className="text-lg font-bold">{detected ? `Visiting from ${detected.name}?` : 'Welcome to Plentovo'}</h2>
        <button type="button" aria-label="Close country popup" onClick={() => setOpen(false)} className="ml-4 rounded p-2 text-xl leading-none">×</button>
      </div>
      <div className="p-6 sm:p-8">
        <h3 className="text-2xl font-extrabold sm:text-3xl">Good things, closer to you.</h3>
        <p className="mt-3 text-sm leading-6 text-gray-600">{suggested ? `Explore products available for delivery in ${suggested.name}, with prices in ${suggested.currency}.` : detected ? `Delivery to ${detected.name} is not available yet. You can browse another country's range, but delivery remains limited to that country.` : 'We could not detect your country. Choose where you would like your order delivered.'}</p>
        {!changing && suggested && <button type="button" disabled={busy} onClick={() => choose(suggested.code)} className="mt-6 w-full rounded-lg bg-[#DA292B] px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : `Continue with ${suggested.name}`}</button>}
        {!changing && suggested && <button type="button" disabled={busy} onClick={() => setChanging(true)} className="mt-3 w-full rounded-lg border px-5 py-3 font-semibold">Change delivery country</button>}
        {(changing || !suggested) && <div className="mt-6">
          <label htmlFor="delivery-country" className="block text-sm font-semibold">Delivery country</label>
          <select id="delivery-country" value={choice} onChange={e => setChoice(e.target.value)} className="mt-2 w-full rounded-lg border bg-white px-3 py-3">
            <option value="">Choose an available country</option>
            {data?.markets.map(m => <option key={m.code} value={m.code}>{m.name} · {m.currency}</option>)}
          </select>
          <button type="button" disabled={busy || !choice} onClick={() => choose(choice)} className="mt-3 w-full rounded-lg bg-[#DA292B] px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Continue shopping'}</button>
        </div>}
        <label className="mt-5 flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/>Remember my choice</label>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      </div>
    </dialog>
  </>;
}

"use client";
import {useEffect, useState} from 'react';
type Market = {code: string; name: string; currency: string};
export function MarketSelector() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [current, setCurrent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/commerce/markets', {signal: controller.signal}).then(async r => {
      if (!r.ok) throw new Error('Country selection is temporarily unavailable.');
      const data = await r.json(); setMarkets(data.markets); setCurrent(data.selectedMarket || '');
    }).catch(e => {if (e.name !== 'AbortError') setError('Country selection is temporarily unavailable.');});
    return () => controller.abort();
  }, []);
  async function choose(code: string) {
    setBusy(true); setError('');
    try {
      const r = await fetch('/api/commerce/markets', {method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({code})});
      if (!r.ok) throw new Error('Could not save your country. Please try again.');
      window.location.reload();
    } catch(e) {setError(e instanceof Error ? e.message : 'Please try again.'); setBusy(false);}
  }
  return <div className="border-b bg-stone-50 px-4 py-2 text-center text-sm">
    <label className="inline-flex items-center gap-2">Shopping country
      <select aria-label="Shopping country" disabled={busy || !markets.length} value={current} onChange={e => choose(e.target.value)} className="rounded border bg-white px-2 py-1">
        {!current && <option value="">Choose country</option>}
        {markets.map(m => <option key={m.code} value={m.code}>{m.name} · {m.currency}</option>)}
      </select>
    </label>
    <span className="ml-3 text-xs text-gray-600">Products and delivery availability depend on your country.</span>
    {error && <p role="alert" className="mt-1 text-red-700">{error}</p>}
  </div>;
}

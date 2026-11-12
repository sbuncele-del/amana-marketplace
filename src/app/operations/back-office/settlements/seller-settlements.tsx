'use client';

import {useEffect, useState, type FormEvent} from 'react';

type Settlement = {id: string; status: string; seller_cost_cents: string | null; settled_at: string | null;
  settlement_reference: string | null; supplier: string; reference: string; on_hold: boolean};
const money = new Intl.NumberFormat('en-ZA', {style: 'currency', currency: 'ZAR'});
const endpoint = '/api/operations/supplier-shipments';

export function SellerSettlements() {
  const [rows, setRows] = useState<Settlement[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${endpoint}?page=${page}`, {signal: controller.signal, cache: 'no-store'}).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (!controller.signal.aborted) {setRows(data.rows); setMore(data.more);}
    }).catch(error => {if (!controller.signal.aborted) setError(error.message);});
    return () => controller.abort();
  }, [page, revision]);

  async function settle(event: FormEvent<HTMLFormElement>, shipmentId: string) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const reference = new FormData(event.currentTarget).get('reference');
      const response = await fetch(endpoint, {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: 'settle', shipmentId, reference})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSelected(null); setRevision(value => value + 1); setNotice('Seller payment recorded.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not record payment.');
    } finally {setBusy(false);}
  }

  return <div className="space-y-4">
    <p className="text-sm text-stone-600">Review agreed seller amounts by shipment and record payments after they clear. Open delivery, return and payment issues put unpaid shipments on hold.</p>
    {error && <p role="alert" className="text-red-800">{error}</p>}
    {notice && <p role="status" className="text-green-800">{notice}</p>}
    <div className="overflow-auto rounded-xl border border-stone-200 bg-white">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead className="bg-stone-50"><tr>{['Order','Seller','Agreed amount','Settlement','Action'].map(label => <th className="p-3" scope="col" key={label}>{label}</th>)}</tr></thead>
        <tbody>{rows?.map(row => {
          const ready = !row.settled_at && !row.on_hold && row.status === 'DELIVERED' && row.seller_cost_cents !== null;
          const label = row.settled_at ? 'Payment recorded' : row.on_hold ? 'On hold' : row.status !== 'DELIVERED' ? 'Awaiting delivery' : row.seller_cost_cents === null ? 'Amount unavailable' : 'Ready to pay';
          return <tr className="border-t border-stone-200 align-top" key={row.id}>
            <td className="p-3">{row.reference}</td><td className="p-3">{row.supplier}</td>
            <td className="p-3">{row.seller_cost_cents === null ? '—' : money.format(Number(row.seller_cost_cents) / 100)}</td>
            <td className="p-3">{label}{row.settlement_reference && <small className="block">{row.settlement_reference}</small>}</td>
            <td className="p-3">{ready && (selected === row.id ? <form onSubmit={event => settle(event, row.id)} className="space-y-2">
              <label className="block">Payment reference<input name="reference" required minLength={3} maxLength={120} className="mt-1 block w-full rounded border p-2" /></label>
              <label className="flex gap-2"><input type="checkbox" required />The seller payment has cleared.</label>
              <button className="font-semibold text-red-700 underline" disabled={busy}>{busy ? 'Saving…' : 'Save payment record'}</button>
              <button type="button" className="ml-2 underline" disabled={busy} onClick={() => setSelected(null)}>Cancel</button>
            </form> : <button className="font-semibold text-red-700 underline" onClick={() => setSelected(row.id)}>Record payment</button>)}</td>
          </tr>;
        })}</tbody>
      </table>
      {!rows?.length && !error && <p className="p-4 text-sm">{rows ? 'No supplier shipments on this page.' : 'Loading seller settlements…'}</p>}
    </div>
    {(page > 1 || more) && <div className="flex gap-4 text-sm"><button className="underline disabled:opacity-40" disabled={page <= 1 || busy} onClick={() => {setSelected(null); setPage(value => value - 1);}}>Previous</button><span>Page {page}</span><button className="underline disabled:opacity-40" disabled={!more || busy} onClick={() => {setSelected(null); setPage(value => value + 1);}}>Next</button></div>}
  </div>;
}

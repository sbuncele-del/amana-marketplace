'use client';

import {useEffect, useState, type FormEvent} from 'react';
import type {BackOfficeOrder} from '@/lib/back-office';

type Assignments = {
  assignable: boolean;
  partners: {id: string; name: string}[];
  shipments: {id: string; supplier: string; status: string; tracking_number: string | null;
    lines: {orderLineIndex: number | null; name: string | null; quantity: number}[]}[];
};

const field = 'mt-1 block w-full rounded-md border border-stone-300 bg-white px-2 py-2';

export function OrderSuppliers({order}: {order: BackOfficeOrder}) {
  const [data, setData] = useState<Assignments | null>(null);
  const [line, setLine] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/operations/supplier-shipments?order=${encodeURIComponent(order.id)}`, {signal: controller.signal, cache: 'no-store'});
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (!controller.signal.aborted) setData(result);
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Unable to load suppliers.');
      }
    }
    void load();
    const timer = setInterval(() => {if (!document.hidden) void load();}, 30000);
    return () => {controller.abort(); clearInterval(timer);};
  }, [order.id, order.status, revision]);

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || line === null) return;
    const values = new FormData(event.currentTarget);
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/operations/supplier-shipments', {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: 'assign', orderId: order.id, lineIndex: line, partnerId: values.get('partnerId'),
          unitCostCents: Math.round(Number(values.get('unitCost')) * 100)})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setLine(null); setRevision(value => value + 1);
      setNotice('Item assigned. The seller can accept it in the Partner workspace.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to assign item.');
    } finally {
      setBusy(false);
    }
  }

  const legacy = data?.shipments.filter(shipment => shipment.lines.some(item => item.orderLineIndex === null)) ?? [];
  return <section className="my-3 w-full space-y-3 rounded-xl border border-stone-200 bg-white p-4 text-sm">
    <h3>Suppliers and shipments</h3>
    {!data && !error && <p role="status">Loading supplier assignments…</p>}
    {notice && <p role="status" className="text-green-800">{notice}</p>}
    {error && <p role="alert" className="text-red-800">{error}</p>}
    {data && order.items.map((item, index) => {
      const shipment = data.shipments.find(entry => entry.lines.some(entryLine => entryLine.orderLineIndex === index));
      return <div key={index} className="space-y-1 border-t border-stone-200 pt-2">
        <p className="font-semibold">{item.name} × {item.quantity}</p>
        {shipment ? <>
          <p>{shipment.supplier} · {shipment.status.toLowerCase()}</p>
          {shipment.tracking_number && <p>Tracking {shipment.tracking_number}</p>}
        </> : <p>{legacy.length ? 'See existing shipment assignments below.' : 'Supplier unassigned'}</p>}
        {!shipment && !legacy.length && data.assignable && !!data.partners.length && <button type="button" className="text-red-700 underline" onClick={() => setLine(index)} disabled={busy}>Assign supplier</button>}
      </div>;
    })}
    {legacy.map(shipment => <p key={shipment.id}>{shipment.supplier} · {shipment.status.toLowerCase()}{shipment.tracking_number && ` · Tracking ${shipment.tracking_number}`}</p>)}
    {data?.assignable && !data.partners.length && <p>Add and approve a seller in <a className="text-red-700 underline" href="/operations/back-office/suppliers">Suppliers</a> to assign an item.</p>}
    {line !== null && data && <form key={line} onSubmit={assign} className="space-y-2 rounded-lg border border-stone-200 p-3">
      <p className="font-semibold">Assign {order.items[line]?.name}</p>
      <label className="block">Supplier<select name="partnerId" className={field} required><option value="">Select a supplier</option>{data.partners.map(partner => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</select></label>
      <label className="block">Agreed amount per item (ZAR)<input name="unitCost" className={field} type="number" min="0" max="1000000" step="0.01" required /></label>
      <div className="flex gap-3"><button className="rounded-md bg-[#d4252d] px-3 py-2 font-semibold text-white" disabled={busy}>{busy ? 'Assigning…' : 'Confirm assignment'}</button>
        <button type="button" className="underline" disabled={busy} onClick={() => setLine(null)}>Cancel</button></div>
    </form>}
  </section>;
}

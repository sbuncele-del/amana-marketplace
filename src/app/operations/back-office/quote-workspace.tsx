'use client';

import {useState, type FormEvent, type ReactNode} from 'react';
import type {BackOfficeOrder} from '@/lib/back-office';
import {quoteDate} from '@/lib/back-office-quote';

const field = 'mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2';
const primary = 'rounded-lg bg-[#d4252d] px-4 py-2 font-semibold text-white disabled:opacity-50';
const secondary = 'rounded-lg border border-stone-300 bg-white px-4 py-2 font-semibold disabled:opacity-50';
const card = 'my-4 w-full space-y-3 rounded-xl border border-stone-200 bg-white p-4 text-sm';
const currency = new Intl.NumberFormat('en-ZA', {style: 'currency', currency: 'ZAR'});
const money = (cents: number) => currency.format(cents / 100);

type Result = {id: string; reference: string};
async function save(payload: object): Promise<Result> {
  const response = await fetch('/api/operations/back-office/quotes', {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Could not save. Try again.');
  return result;
}

function Field({label, children}: {label: string; children: ReactNode}) {
  return <label className="block font-medium">{label}{children}</label>;
}

export function NewEnquiry({onCancel, onSaved}: {onCancel: () => void; onSaved: (result: Result) => void}) {
  const [requestKey] = useState(() => crypto.randomUUID());
  const [lines, setLines] = useState([0]);
  const [lineId, setLineId] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      await save({
        action: 'create', requestKey,
        ...Object.fromEntries(['customerName','email','phone','city','deliveryTerms','note'].map(key => [key, values.get(key)])),
        items: lines.map(id => ({name: values.get(`name-${id}`), quantity: Number(values.get(`quantity-${id}`)), sku: values.get(`sku-${id}`)})),
      }).then(onSaved);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save the enquiry.');
    } finally {
      setBusy(false);
    }
  }
  return <form className={card} onSubmit={submit}>
    <h3 className="text-lg font-bold">New enquiry</h3>
    <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
      <Field label="Customer or company"><input name="customerName" className={field} required maxLength={100} autoFocus /></Field>
      <Field label="Email"><input type="email" name="email" className={field} maxLength={254} /></Field>
      <Field label="Phone"><input type="tel" name="phone" className={field} maxLength={40} /></Field>
      <Field label="Delivery destination"><input name="city" className={field} maxLength={150} /></Field>
      <Field label="Delivery address and requirements"><textarea name="deliveryTerms" className={field} maxLength={2000} /></Field>
      <Field label="Enquiry notes"><textarea name="note" className={field} maxLength={2000} /></Field>
      {lines.map((id, index) => <fieldset key={id} className="grid gap-2 rounded-lg border border-stone-200 p-3 sm:col-span-2 sm:grid-cols-3">
        <legend className="px-1 font-semibold">Item {index + 1}</legend>
        <Field label="Product description"><input name={`name-${id}`} className={field} required maxLength={200} /></Field>
        <Field label="Quantity"><input name={`quantity-${id}`} className={field} type="number" min={1} max={10000} defaultValue={1} required /></Field>
        <Field label="SKU (optional)"><input name={`sku-${id}`} className={field} maxLength={100} /></Field>
        {lines.length > 1 && <button type="button" className="justify-self-start text-red-700 underline" onClick={() => setLines(previous => previous.filter(line => line !== id))}>Remove item {index + 1}</button>}
      </fieldset>)}
    </fieldset>
    {error && <p role="alert" className="text-red-800">{error}</p>}
    <div className="flex flex-wrap gap-2">
      <button type="button" className={secondary} disabled={busy || lines.length >= 50} onClick={() => {setLines(previous => [...previous, lineId]); setLineId(previous => previous + 1);}}>Add item</button>
      <button className={primary} disabled={busy}>{busy ? 'Saving…' : 'Save enquiry'}</button>
      <button type="button" className={secondary} disabled={busy} onClick={onCancel}>Cancel</button>
    </div>
  </form>;
}

function Amount({label, name, value, positive = false}: {label: string; name: string; value?: number | null; positive?: boolean}) {
  return <Field label={label}><input name={name} className={field} type="number" min={positive ? '0.01' : '0'} max="1000000" step="0.01" required
    defaultValue={value == null ? undefined : (value / 100).toFixed(2)} /></Field>;
}

export function QuoteWorkspace({order, onSaved}: {order: BackOfficeOrder; onSaved: (message: string) => void}) {
  const [mode, setMode] = useState<'price' | 'accept' | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const pricing = order.quotePricing;
  const expired = !!pricing && pricing.expiry < quoteDate();
  const [baseVersion, setBaseVersion] = useState(order.version);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !mode) return;
    const values = new FormData(event.currentTarget);
    const amount = (name: string) => Math.round(Number(values.get(name)) * 100);
    setBusy(true);
    setError('');
    try {
      await save({
        action: mode, id: order.id, version: baseVersion,
        ...(mode === 'accept' ? {note: values.get('note')} : {
          ...Object.fromEntries(['supplier','supplierOffer','freightProvider','freightOffer','deliveryTerms','expiry'].map(key => [key, values.get(key)])),
          freightCostCents: amount('freightCost'), shippingCents: amount('shipping'),
          prices: order.items.map((_, index) => ({unitPriceCents: amount(`sell-${index}`), unitCostCents: amount(`cost-${index}`)})),
        }),
      });
      setMode(null);
      onSaved(mode === 'accept' ? `Quote ${order.reference} accepted. Find the order under Payments, awaiting EFT.` : `Quote ${order.reference} saved.`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save the quote.');
    } finally {
      setBusy(false);
    }
  }

  async function copyQuote() {
    if (!pricing || expired || order.delivery === null) return;
    setError('');
    try {
      await navigator.clipboard.writeText([
        `Plentovo quote ${order.reference}`, `Prepared for ${order.customer}`,
        ...order.items.map(item => `${item.quantity} × ${item.name}${item.option ? ` (${item.option})` : ''} at ${money(item.unit ?? 0)} each`),
        `Delivery: ${money(order.delivery)}`, `Total: ${money(order.subtotal + order.delivery)}`,
        `Delivery terms: ${pricing.deliveryTerms}`, `Valid through ${pricing.expiry}`,
      ].join('\n'));
      setMessage('Customer quote copied.');
    } catch {
      setError('Clipboard unavailable. Use the quote totals and delivery terms shown here.');
    }
  }

  return <section className={card} aria-label="Quote workflow">
    <h3>Quote details</h3>
    {order.quoteEmail && <p className="break-all">{order.quoteEmail}</p>}
    {order.quotePhone && <p>{order.quotePhone}</p>}
    {order.enquiryNote && <p className="whitespace-pre-wrap">{order.enquiryNote}</p>}
    {order.deliveryTerms && <p className="whitespace-pre-wrap"><strong>Delivery terms</strong><br />{order.deliveryTerms}</p>}
    {pricing && <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 break-words">
      <dt>Supplier</dt><dd>{[pricing.supplier, pricing.supplierOffer].filter(Boolean).join(' · ')}</dd>
      <dt>Freight</dt><dd>{[pricing.freightProvider, pricing.freightOffer, money(pricing.freightCostCents)].filter(Boolean).join(' · ')}</dd>
      <dt>Gross margin</dt><dd>{money(pricing.marginCents)}</dd>
      <dt>Valid through</dt><dd>{pricing.expiry}{expired && ' · Expired'}</dd>
    </dl>}
    {message && <p role="status">{message}</p>}
    {error && <p role="alert" className="text-red-800">{error}</p>}
    {!mode ? <div className="flex flex-wrap gap-2">
      {order.canManage && <button className={primary} onClick={() => {setBaseVersion(order.version); setMode('price'); setError('');}}>{pricing ? 'Edit pricing' : 'Price quote'}</button>}
      {pricing && !expired && <button className={secondary} onClick={copyQuote}>Copy customer quote</button>}
      {order.canManage && pricing && !expired && <button className={secondary} onClick={() => {setBaseVersion(order.version); setMode('accept'); setError('');}}>Record acceptance</button>}
    </div> : <form onSubmit={submit} className="space-y-3">
      <fieldset disabled={busy} className="space-y-3">
        {mode === 'accept' ? <Field label="How the customer accepted"><textarea name="note" className={field} required minLength={3} maxLength={2000} /></Field> : <>
          <Field label="Supplier"><input name="supplier" className={field} defaultValue={pricing?.supplier} required maxLength={150} /></Field>
          <Field label="Supplier offer reference or notes"><input name="supplierOffer" className={field} defaultValue={pricing?.supplierOffer} maxLength={500} /></Field>
          {order.items.map((item, index) => <fieldset key={index} className="grid gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-2">
            <legend className="px-1">{item.name} × {item.quantity}</legend>
            <Amount label="Unit cost (ZAR)" name={`cost-${index}`} value={pricing?.unitCosts[index]} />
            <Amount label="Unit selling price (ZAR)" name={`sell-${index}`} value={item.unit} positive />
          </fieldset>)}
          <Field label="Freight provider"><input name="freightProvider" className={field} defaultValue={pricing?.freightProvider} maxLength={150} /></Field>
          <Field label="Freight quote reference or notes"><input name="freightOffer" className={field} defaultValue={pricing?.freightOffer} maxLength={500} /></Field>
          <Amount label="Freight cost to Plentovo (ZAR)" name="freightCost" value={pricing?.freightCostCents} />
          <Amount label="Delivery charged to customer (ZAR)" name="shipping" value={order.delivery} />
          <Field label="Delivery terms shown to customer"><textarea name="deliveryTerms" className={field} defaultValue={order.deliveryTerms} required maxLength={2000} /></Field>
          <Field label="Quote expiry"><input name="expiry" type="date" className={field} defaultValue={pricing?.expiry} min={quoteDate()} required /></Field>
        </>}
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <button className={primary} disabled={busy}>{busy ? 'Saving…' : mode === 'accept' ? 'Convert to order' : 'Save quote'}</button>
        <button type="button" className={secondary} disabled={busy} onClick={() => {setMode(null); setError('');}}>Cancel</button>
      </div>
    </form>}
  </section>;
}

export function QuotePaymentInstructions({id}: {id: string}) {
  const [instructions, setInstructions] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadInstructions() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/operations/back-office/quotes?paymentFor=${encodeURIComponent(id)}`, {cache: 'no-store'});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setInstructions(data.instructions);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Payment instructions are unavailable.');
    } finally {
      setBusy(false);
    }
  }

  return <section className={card} aria-label="EFT instructions">
    {instructions ? <>
      <Field label="Customer EFT instructions"><textarea className={field} readOnly rows={8} value={instructions} /></Field>
      <button className={secondary} onClick={async () => {
        try {await navigator.clipboard.writeText(instructions); setMessage('EFT instructions copied.'); setError('');}
        catch {setError('Select the instructions above and copy them.');}
      }}>Copy EFT instructions</button>
    </> : <button className={secondary} disabled={busy} onClick={loadInstructions}>{busy ? 'Loading…' : 'Show customer EFT instructions'}</button>}
    {message && <p role="status">{message}</p>}
    {error && <p role="alert" className="text-red-800">{error}</p>}
  </section>;
}

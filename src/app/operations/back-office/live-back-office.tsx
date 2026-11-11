'use client';

import {useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import {Check, CreditCard, FileText, House, Landmark, Package, Search, ShoppingCart, Truck, X} from 'lucide-react';
import {marketNames, queues, type BackOfficeOrder, type BackOfficeReport, type Market} from '@/lib/back-office';
import {STATUS_LABEL, type DeskStatus} from '@/lib/orders-desk/domain';
import styles from '../../experience-preview/preview.module.css';

const icons = {payment: Landmark, dispatch: Package, delivery: Truck, quote: FileText};
type Queue = keyof typeof icons | 'all';
type History = {label: string; note: string; at: string; actor?: string}[];

const statusText = (status: string) => status.toLowerCase().replaceAll('_', ' ').replace(/^./, letter => letter.toUpperCase());
const date = (value: string | Date, market: Market) => new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: market === 'ZA' ? 'Africa/Johannesburg' : 'Africa/Tunis',
}).format(new Date(value));
const money = (amount: number, market: Market) => new Intl.NumberFormat('en-GB', {
  style: 'currency', currency: market === 'ZA' ? 'ZAR' : 'TND',
}).format(amount / (market === 'ZA' ? 100 : 1000));

async function read<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, {cache: 'no-store', signal});
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Could not sync. Try again.');
  return body;
}

export function LiveBackOffice({markets}: {markets: Market[]}) {
  const [market, setMarket] = useState(markets[0]);
  const [tab, setTab] = useState('Today');
  const [queue, setQueue] = useState<Queue>('all');
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sync, setSync] = useState(0);
  const [report, setReport] = useState<BackOfficeReport | null>(null);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<History | null>(null);
  const [historyError, setHistoryError] = useState('');
  const [review, setReview] = useState(false);
  const [reference, setReference] = useState('');
  const [cleared, setCleared] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [notice, setNotice] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const selected = report?.orders.find(order => order.id === selectedId);
  const definitions = queues[market];

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({market, queue, search: submittedSearch, page: String(page)});
    let inFlight = false;
    async function refresh() {
      if (inFlight) return;
      inFlight = true;
      setLoading(true);
      setError('');
      try {
        const result = await read<BackOfficeReport>(`/api/operations/back-office?${params}`, controller.signal);
        if (!controller.signal.aborted) {setReport(result); setLoadedAt(new Date());}
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not sync.');
      } finally {
        inFlight = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void refresh();
    const timer = setInterval(() => {if (!document.hidden) void refresh();}, 30000);
    return () => {controller.abort(); clearInterval(timer);};
  }, [market, queue, submittedSearch, page, sync]);

  const historyId = market === 'ZA' ? selected?.id : selected?.reference;
  useEffect(() => {
    if (!historyId) return;
    const controller = new AbortController();
    const id = encodeURIComponent(historyId);
    setHistory(null);
    setHistoryError('');
    const request = market === 'ZA'
      ? read<{events: {type: string; note: string; createdAt: string; actorName?: string}[]}>(`/api/experience/command?id=${id}`, controller.signal)
        .then(data => data.events.map(event => ({label: statusText(event.type), note: event.note, at: event.createdAt, actor: event.actorName})))
      : read<{history: {to: string; note: string; at: string; by: string}[]}>(`/api/orders-desk?history=${id}`, controller.signal)
        .then(data => data.history.map(event => ({label: STATUS_LABEL[event.to as DeskStatus] || statusText(event.to), note: event.note, at: event.at, actor: event.by})));
    request.then(events => {if (!controller.signal.aborted) setHistory(events);})
      .catch(() => {if (!controller.signal.aborted) setHistoryError('Order history could not sync.');});
    return () => controller.abort();
  }, [historyId, market, sync]);

  function resetDetail() {
    setSelectedId(null);
    setReview(false);
    setReference('');
    setCleared(false);
    setPaymentError('');
  }

  function changeQueue(next: Queue) {
    resetDetail();
    setQueue(next);
    setPage(1);
    setNotice('');
  }

  function closeOrder() {
    resetDetail();
    trigger.current?.focus();
  }

  async function verifyPayment(order: BackOfficeOrder) {
    if (!reference.trim() || !cleared || saving) return;
    setSaving(true);
    setPaymentError('');
    try {
      const response = await fetch('/api/experience/command', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({action: 'transition', id: order.id, version: order.version, status: 'PAID',
          note: 'Cleared EFT matched to the order reference and total in Back Office.', paymentReference: reference.trim()}),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Payment could not be recorded.');
      setReview(false);
      setReference('');
      setCleared(false);
      setNotice(`Order ${order.reference} marked paid and ready for fulfilment.`);
      setSync(previous => previous + 1);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Payment could not be recorded.');
    } finally {
      setSaving(false);
    }
  }

  const label = (order: BackOfficeOrder) => market === 'TN'
    ? STATUS_LABEL[order.status as DeskStatus] || statusText(order.status)
    : order.bucket === 'payment' ? 'Awaiting EFT' : statusText(order.status);
  const destination = market === 'ZA' ? '/operations' : '/operations/orders';

  return <div className={styles.shell} data-panel={!!selected}>
    <aside className={styles.sidebar}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/plentovo-light.svg" alt="Plentovo" className={styles.logo} />
      <nav aria-label="Back office">
        {[{title: 'Today', icon: House, queue: 'all'}, {title: 'Orders', icon: ShoppingCart, queue: 'all'},
          {title: market === 'ZA' ? 'Payments' : 'COD calls', icon: CreditCard, queue: 'payment'},
          {title: 'Delivery', icon: Truck, queue: 'delivery'},
          ...(market === 'ZA' ? [{title: 'Quotes', icon: FileText, queue: 'quote'}] : [])].map(({title, icon: Icon, queue: key}) =>
          <button key={title} disabled={saving} aria-current={tab === title ? 'page' : undefined} onClick={() => {setTab(title); changeQueue(key as Queue);}}>
            <Icon size={24} aria-hidden="true" />{title}
          </button>)}
      </nav>
      <Link href={destination} className="mx-5 mt-8 block text-sm underline">{market === 'ZA' ? 'Operations centre' : 'Tunisia Orders Desk'}</Link>
    </aside>
    <header className={styles.header}>
      <select className={styles.market} aria-label="Market" value={market} disabled={saving} onChange={event => {
        setMarket(event.target.value as Market); setTab('Today'); changeQueue('all');
        setReport(null); setLoadedAt(null); setSearch(''); setSubmittedSearch('');
      }}>{markets.map(code => <option key={code} value={code}>{code === 'ZA' ? '🇿🇦' : '🇹🇳'} {marketNames[code]}</option>)}</select>
      <form className={styles.search} onSubmit={event => {event.preventDefault(); resetDetail(); setPage(1); setSubmittedSearch(search.trim());}}>
        <button aria-label="Search" disabled={saving}><Search size={20} /></button>
        <input aria-label="Search orders, products and customers" placeholder="Search orders, products, customers…" maxLength={100} disabled={saving} value={search} onChange={event => setSearch(event.target.value)} />
      </form>
    </header>
    <main className={styles.main} id="main-content">
      <h1>{tab}</h1>
      <p className={styles.date}>{marketNames[market]} · {market === 'ZA' ? 'ZAR' : 'TND · Cash on delivery'}</p>
      <p className="mt-2 text-sm text-gray-600" role="status">{loadedAt ? `Last synced ${date(loadedAt, market)}` : 'Connecting to order records'}
        <button type="button" className="ml-3 underline" disabled={loading || saving} onClick={() => setSync(value => value + 1)}>Refresh</button>
      </p>
      {tab === 'Today' && <div className={styles.cards} aria-label="Filter work queue">{definitions.map(({key, title}) => {
        const Icon = icons[key];
        return <button key={key} type="button" disabled={saving} aria-pressed={queue === key} onClick={() => changeQueue(queue === key ? 'all' : key)}>
          <span className={styles.tile} data-stage={key}><Icon size={25} aria-hidden="true" /></span>
          <span className={styles.metric}>{title}<strong>{report ? report.counts[key] ?? 0 : '–'}</strong></span>
        </button>;
      })}</div>}
      {error && <p role="alert" className="my-3 text-sm text-red-800">{error}{report && ' Showing the last successful results.'}</p>}
      {notice && <p role="status" className={styles.notice}>{notice}</p>}
      <h2>{queue === 'all' ? 'Order queue' : definitions.find(item => item.key === queue)?.title}</h2>
      <div className={styles.tableWrap} aria-busy={loading}>
        <table className={styles.table}>
          <thead><tr><th scope="col">Order / quote</th><th scope="col">Status</th><th scope="col">Next action</th><th scope="col">{market === 'TN' ? 'Last called by' : 'Owner'}</th></tr></thead>
          <tbody>{report?.orders.map(order => <tr key={order.id} data-selected={order.id === selectedId}>
            <td><button type="button" disabled={saving} className={styles.rowButton} aria-pressed={order.id === selectedId} onClick={event => {
              trigger.current = event.currentTarget; resetDetail(); setHistory(null); setSelectedId(order.id);
              requestAnimationFrame(() => closeButton.current?.focus());
            }}><span className={styles.tile} data-stage="order"><ShoppingCart size={22} aria-hidden="true" /></span>
              <span><strong>{order.reference}</strong><small>{order.customer || 'Customer'}</small></span></button></td>
            <td><span className={styles.chip} data-stage={order.bucket}>{label(order)}</span></td>
            <td>{definitions.find(item => item.key === order.bucket)?.action ?? 'View order'}</td>
            <td>{order.owner || '–'}</td>
          </tr>)}</tbody>
        </table>
        {!report?.orders.length && <p className={styles.empty}>{loading ? 'Loading orders…' : error ? 'Refresh to retry.' : 'No orders match this view.'}</p>}
      </div>
      {(page > 1 || (report?.total ?? 0) > 25) && <div className="mt-5 flex items-center gap-4 text-sm">
        <button disabled={page <= 1 || saving || loading} className="underline disabled:opacity-40" onClick={() => {resetDetail(); setPage(value => value - 1);}}>Previous</button>
        <span>Page {page} · {report?.total ?? 0} records</span>
        <button disabled={page * 25 >= (report?.total ?? 0) || saving || loading} className="underline disabled:opacity-40" onClick={() => {resetDetail(); setPage(value => value + 1);}}>Next</button>
      </div>}
    </main>
    {selected && <aside className={styles.detail} aria-label={`Order ${selected.reference}`} onKeyDown={event => {if (event.key === 'Escape' && !saving) closeOrder();}}>
      <div className={styles.detailHeading}><h2 className="min-w-0 break-words">{selected.reference}</h2><button ref={closeButton} disabled={saving} aria-label="Close order details" onClick={closeOrder}><X size={21} /></button></div>
      <span className={styles.chip} data-stage={selected.bucket}>{label(selected)}</span>
      <dl className={styles.meta}><dt>Placed</dt><dd>{date(selected.createdAt, market)}</dd><dt>Customer</dt><dd>{selected.customer || '–'}</dd><dt>Location</dt><dd>{selected.location || '–'}</dd>
        {selected.trackingNumber && <><dt>Tracking</dt><dd className="break-words">{selected.trackingNumber}</dd></>}
        {selected.carrierStatus && <><dt>Carrier status</dt><dd>{statusText(selected.carrierStatus)}</dd></>}
      </dl>
      <section className={styles.items}><h3>Order items</h3>
        {selected.items.map((item, index) => <div className={styles.line} key={index}>
          <div><strong>{item.name} × {item.quantity}</strong>{(item.option || item.sku) && <small>{[item.option, item.sku].filter(Boolean).join(' · ')}</small>}</div>
          {item.unit !== null && <span>{money(item.unit * item.quantity, market)}</span>}
        </div>)}
      </section>
      <div className={styles.amount}><span>Items</span><span>{money(selected.subtotal, market)}</span></div>
      <div className={styles.amount}><span>Delivery</span><span>{selected.delivery === null ? 'Awaiting confirmation' : money(selected.delivery, market)}</span></div>
      <div className={styles.total}><strong>Total</strong><strong>{selected.delivery === null ? 'Pending' : money(selected.subtotal + selected.delivery, market)}</strong></div>
      {market === 'TN' && <p className="mb-4 text-sm text-gray-600">COD settlement requires confirmation from your courier records.</p>}
      <section className={styles.history}><h3>Order history</h3>
        {historyError ? <p role="alert">{historyError}</p> : history === null ? <p>Loading history…</p> : history.length ? <ol>{history.map((event, index) =>
          <li key={index}><Check size={18} /><span><strong>{event.label}</strong><small>{date(event.at, market)}{event.actor && ` · ${event.actor}`}</small>{event.note && <small>{event.note}</small>}</span></li>
        )}</ol> : <p className="mt-2 text-sm text-gray-600">No history has been recorded.</p>}
      </section>
      {selected.canVerify && selected.delivery !== null ? review ? <form className={styles.review} onSubmit={event => {event.preventDefault(); void verifyPayment(selected);}}>
        <label>Bank transaction reference<input required maxLength={100} autoFocus disabled={saving} value={reference} onChange={event => setReference(event.target.value)} /></label>
        <label className={styles.check}><input type="checkbox" required disabled={saving} checked={cleared} onChange={event => setCleared(event.target.checked)} />The reference matches order {selected.reference} and {money(selected.subtotal + selected.delivery, market)} has cleared.</label>
        {paymentError && <p role="alert" className="text-sm text-red-800">{paymentError}</p>}
        <button className={styles.primary} disabled={saving || loading}>{saving ? 'Recording…' : 'Mark as paid'}</button>
        <button type="button" className={styles.cancel} disabled={saving} onClick={() => {setReview(false); setReference(''); setCleared(false); setPaymentError('');}}>Cancel</button>
      </form> : <button className={styles.primary} disabled={loading} onClick={() => setReview(true)}>Review payment</button>
        : <Link className="mt-3 text-sm font-semibold text-red-700 underline" href={destination}>{market === 'TN' ? 'Manage COD order in Orders Desk' : 'Open Operations Centre'}</Link>}
    </aside>}
  </div>;
}

'use client';

import {useEffect, useRef, useState} from 'react';
import {AlertTriangle, Check, CreditCard, FileText, House, Landmark, Layers3, Package, Search, ShoppingCart, Truck, Users, X} from 'lucide-react';
import styles from './preview.module.css';

const stages = {
  payment: {label: 'Awaiting EFT', action: 'Verify bank transfer', owner: 'Accounts', icon: Landmark},
  dispatch: {label: 'Ready to dispatch', action: 'Pick and pack', owner: 'Warehouse', icon: Package},
  delivery: {label: 'Delivery exception', action: 'Resolve address issue', owner: 'Delivery', icon: AlertTriangle},
  quote: {label: 'Freight quote due', action: 'Follow up with Zeen', owner: 'Sales', icon: FileText},
};
type Stage = keyof typeof stages;
type Work = {id: string; title: string; stage: Stage; customer: string; product: string; sku: string; quantity: number; unit: number; delivery: number};

const sampleOrders: Work[] = [
  {id: 'PL-1042', title: 'Order #PL-1042', stage: 'payment', customer: 'Lindiwe Maseko', product: 'Baby feeding booster', sku: 'BB-1001', quantity: 1, unit: 329, delivery: 79},
  {id: 'PL-1039', title: 'Order #PL-1039', stage: 'dispatch', customer: 'Thabo Dlamini', product: 'Kitchen storage set', sku: 'KS-210', quantity: 2, unit: 560, delivery: 79},
  {id: 'PL-1036', title: 'Order #PL-1036', stage: 'delivery', customer: 'Naledi Nkosi', product: 'Home organiser set', sku: 'HO-110', quantity: 3, unit: 256.67, delivery: 79},
  {id: 'Q-0187', title: '52 GEL batteries', stage: 'quote', customer: 'Sample business customer', product: '12 V 180 Ah GEL VRLA battery', sku: 'WEST-ZA32', quantity: 52, unit: 0, delivery: 0},
];

const cards = [
  {stage: 'payment', title: 'Awaiting EFT', count: 8},
  {stage: 'dispatch', title: 'Ready to dispatch', count: 12},
  {stage: 'delivery', title: 'Delivery exceptions', count: 3},
  {stage: 'quote', title: 'Quotes due', count: 4},
] as const;
const nav = [
  {title: 'Today', icon: House},
  {title: 'Orders', icon: ShoppingCart},
  {title: 'Payments', icon: CreditCard},
  {title: 'Products', icon: Package},
  {title: 'Suppliers', icon: Layers3},
  {title: 'Quotes', icon: FileText},
  {title: 'Delivery', icon: Truck},
  {title: 'Customers', icon: Users},
] as const;
type Tab = typeof nav[number]['title'];

const money = (value: number) => 'R' + value.toLocaleString('en-GB', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const total = (order: Work) => order.unit * order.quantity + order.delivery;

export function BackOfficePreview() {
  const [tab, setTab] = useState<Tab>('Today');
  const [filter, setFilter] = useState<Stage | null>(null);
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState(sampleOrders);
  const [selectedId, setSelectedId] = useState<string | null>('PL-1042');
  const [reviewing, setReviewing] = useState(false);
  const [reference, setReference] = useState('');
  const [cleared, setCleared] = useState(false);
  const [verified, setVerified] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const searchInput = useRef<HTMLInputElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const reviewButton = useRef<HTMLButtonElement>(null);
  const selected = orders.find(order => order.id === selectedId);

  function closeOrder() {
    setSelectedId(null);
    setReviewing(false);
    trigger.current?.focus();
  }

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInput.current?.focus();
      }
    }
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);

  const visible = orders.filter(order => {
    const inTab = tab === 'Today' || (tab === 'Orders' && order.stage !== 'quote')
      || (tab === 'Payments' && (order.stage === 'payment' || !!verified[order.id]))
      || (tab === 'Quotes' && order.stage === 'quote')
      || (tab === 'Delivery' && ['dispatch', 'delivery'].includes(order.stage));
    return inTab && (!filter || order.stage === filter)
      && [order.title, order.customer, order.product, order.sku].some(value => value.toLowerCase().includes(search.trim().toLowerCase()));
  });

  return <div className={styles.shell} data-panel={!!selected}>
    <aside className={styles.sidebar}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/plentovo-light.svg" alt="Plentovo" className={styles.logo} />
      <nav aria-label="Back office">
        {nav.map(({title, icon: Icon}) => <button key={title} aria-current={tab === title ? 'page' : undefined} onClick={() => {
          setTab(title); setFilter(null); setSearch(''); setSelectedId(null); setReviewing(false); setNotice('');
        }}><Icon size={24} aria-hidden="true" />{title}</button>)}
      </nav>
    </aside>
    <header className={styles.header}>
      <span className={styles.market}><span aria-hidden="true">🇿🇦</span> South Africa</span>
      <label className={styles.search}><Search size={20} aria-hidden="true" /><input ref={searchInput} value={search} placeholder="Search orders, products, customers…" aria-label="Search orders, products and customers" onChange={event => {
        setSearch(event.target.value);
        if (['Products', 'Suppliers', 'Customers'].includes(tab)) setTab('Today');
      }} /><kbd>⌘ K</kbd></label>
    </header>
    <main className={styles.main} id="main-content">
      <h1>{tab}</h1>
      <p className={styles.date}>Wednesday, 11 November</p>
      {tab === 'Today' && <div className={styles.cards} aria-label="Filter work queue">
        {cards.map(({stage, title, count}) => {
          const Icon = stages[stage].icon;
          const difference = orders.filter(order => order.stage === stage).length - sampleOrders.filter(order => order.stage === stage).length;
          return <button key={stage} aria-pressed={filter === stage} onClick={() => setFilter(filter === stage ? null : stage)}>
            <span className={styles.tile} data-stage={stage}><Icon size={25} aria-hidden="true" /></span>
            <span className={styles.metric}>{title}<strong>{count + difference}</strong></span>
          </button>;
        })}
      </div>}
      {notice && <p role="status" className={styles.notice}>{notice}</p>}
      <h2>{tab === 'Today' ? 'Needs attention' : `${tab} queue`}</h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th scope="col">Order / quote</th><th scope="col">Status</th><th scope="col">Next action</th><th scope="col">Owner</th></tr></thead>
          <tbody>{visible.map(order => {
            const stage = stages[order.stage];
            const Icon = order.stage === 'quote' ? FileText : order.stage === 'delivery' ? Truck : ShoppingCart;
            return <tr key={order.id} data-selected={order.id === selectedId}>
              <td><button type="button" className={styles.rowButton} aria-pressed={order.id === selectedId} onClick={event => {
                trigger.current = event.currentTarget;
                setSelectedId(order.id); setReviewing(false); setReference(''); setCleared(false);
                requestAnimationFrame(() => closeButton.current?.focus());
              }}><span className={styles.tile} data-stage="order"><Icon size={22} aria-hidden="true" /></span><span><strong>{order.title}</strong><small>{order.stage === 'quote' ? `Quote ${order.id}` : `${order.quantity} ${order.quantity === 1 ? 'item' : 'items'} · ${money(total(order))}`}</small></span></button></td>
              <td><span className={styles.chip} data-stage={order.stage}><stage.icon size={16} aria-hidden="true" />{stage.label}</span></td>
              <td>{stage.action}</td><td>{stage.owner}</td>
            </tr>;
          })}</tbody>
        </table>
        {!visible.length && <p className={styles.empty}>{['Products', 'Suppliers', 'Customers'].includes(tab) ? `${tab} will open in a later phase.` : 'No sample records match this view.'}</p>}
      </div>
    </main>
    {selected && <aside className={styles.detail} aria-label={selected.title} onKeyDown={event => { if (event.key === 'Escape') closeOrder(); }}>
      <div className={styles.detailHeading}><h2>{selected.title}</h2><button ref={closeButton} type="button" aria-label="Close order details" onClick={closeOrder}><X size={21} /></button></div>
      <span className={styles.chip} data-stage={selected.stage}>{stages[selected.stage].label}</span>
      <dl className={styles.meta}><dt>Placed</dt><dd>Wed, 11 Nov, 09:24</dd><dt>Customer</dt><dd>{selected.customer}</dd><dt>Location</dt><dd>{selected.stage === 'quote' ? 'Gaborone, Botswana' : 'Johannesburg, Gauteng'}</dd></dl>
      <section className={styles.items}>
        <h3>{selected.stage === 'quote' ? 'Quote items' : 'Order items'}</h3>
        <div className={styles.line}>
          {selected.id === 'PL-1042' && <div className={styles.thumbnail}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src="https://cdn.shopify.com/s/files/1/0599/8821/3889/files/Ha7c6e720a0314fd7a4e9b42290e9f322J.webp?v=1772089543" />
          </div>}
          <div><strong>{selected.product} × {selected.quantity}</strong><small>SKU {selected.sku}</small></div>
          {selected.stage !== 'quote' && <span>{money(selected.unit * selected.quantity)}</span>}
        </div>
      </section>
      {selected.stage !== 'quote' && <>
        <div className={styles.amount}><span>Delivery</span><span>{money(selected.delivery)}</span></div>
        <div className={styles.total}><strong>Total</strong><strong>{money(total(selected))}</strong></div>
        <section className={styles.history}><h3>Payment history</h3><ol>
          <li><Check size={18} /><span><strong>Order received</strong><small>Wed, 11 Nov, 09:24</small></span></li>
          <li><Check size={18} /><span><strong>EFT instructions sent</strong><small>Wed, 11 Nov, 09:26</small></span></li>
          {verified[selected.id] && <li><Check size={18} /><span><strong>Payment verified in preview</strong><small>{verified[selected.id]}</small></span></li>}
        </ol></section>
      </>}
      {selected.stage === 'quote' && <p className={styles.notice}>Next step: follow up with Zeen for the freight estimate.</p>}
      {selected.stage === 'payment' && (reviewing ? <form className={styles.review} onSubmit={event => {
        event.preventDefault();
        if (!reference.trim() || !cleared) return;
        setOrders(items => items.map(order => order.id === selected.id ? {...order, stage: 'dispatch'} : order));
        setVerified(previous => ({...previous, [selected.id]: reference.trim()}));
        setReviewing(false);
        setNotice(`${selected.title} is ready to dispatch in this preview.`);
        closeButton.current?.focus();
      }}>
        <label>Bank transaction reference<input autoFocus required maxLength={100} value={reference} onChange={event => setReference(event.target.value)} /></label>
        <label className={styles.check}><input type="checkbox" required checked={cleared} onChange={event => setCleared(event.target.checked)} />The reference matches and {money(total(selected))} has cleared.</label>
        <button className={styles.primary}>Confirm sample payment</button>
        <button type="button" className={styles.cancel} onClick={() => {setReviewing(false); requestAnimationFrame(() => reviewButton.current?.focus());}}>Cancel</button>
      </form> : <button ref={reviewButton} className={styles.primary} onClick={() => setReviewing(true)}>Review payment</button>)}
    </aside>}
    <p className={styles.previewNote}>Design preview · Sample data</p>
  </div>;
}

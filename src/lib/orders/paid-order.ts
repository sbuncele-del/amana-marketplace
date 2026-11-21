// Turns a verified-paid South African order record into the fulfilment alert that staff act on.
// Pure: no database, no network. Money is integer cents of ZAR.
import {brand, esc, layout, paragraph} from '@/lib/mail/layout';

export type PaidItem = {name: string; option: string; quantity: number; unitPriceCents: number; supplierCostCents: number | null; supplierUrl: string | null};
export type PaidOrder = {
  id: string; reference: string; paidAt: string | null; paymentRef: string | null;
  customer: {name: string; phone: string; email: string};
  delivery: {method: 'DELIVERY' | 'COLLECTION'; address: string[]};
  items: PaidItem[]; deliveryCents: number; totalCents: number;
};
export type FeeConfig = {percent: number | null; fixedCents: number | null};
export type Parsed = {ok: true; value: PaidOrder} | {ok: false; problems: string[]};
export const supplierSite = 'https://perfectdealz.co.za';

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const cents = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null);
export const rand = (c: number) => `R${(c / 100).toLocaleString('en-ZA', {minimumFractionDigits: 2, maximumFractionDigits: 2}).replace(/\s/g, ' ')}`;

// Reads the existing experience_records ORDER shape. Fields a checkout adds later
// (deliveryMethod, deliveryAddress, paymentRef, paidAt, item.supplierCostCents) are optional.
export function parsePaidOrder(row: {id: string; reference: string; status: string; data: Record<string, any>}): Parsed {
  const d = row.data ?? {};
  const problems: string[] = [];
  if (d.country !== 'ZA') problems.push('Order is not a South African order.');
  if (d.currency && d.currency !== 'ZAR') problems.push('Order currency is not ZAR.');
  const rawItems: any[] = Array.isArray(d.items) ? d.items : [];
  if (!rawItems.length) problems.push('Order has no items.');
  const items: PaidItem[] = [];
  for (const i of rawItems) {
    const quantity = i?.quantity, price = cents(i?.unitPriceCents), name = text(i?.name);
    if (!name || !Number.isInteger(quantity) || quantity < 1 || quantity > 999 || price === null || price === 0) { problems.push(`Item "${name || '?'}" has an invalid name, quantity or price.`); continue; }
    const slug = text(i?.slug);
    items.push({name, option: text(i?.option), quantity, unitPriceCents: price, supplierCostCents: cents(i?.supplierCostCents) || null, supplierUrl: /^[a-z0-9-]+$/i.test(slug) ? `${supplierSite}/products/${slug}` : null});
  }
  const deliveryCents = cents(d.shippingCents), method = d.deliveryMethod === 'COLLECTION' ? 'COLLECTION' : 'DELIVERY';
  if (deliveryCents === null) problems.push('Delivery fee was not recorded on the order.');
  const itemsCents = items.reduce((n, i) => n + i.quantity * i.unitPriceCents, 0);
  const totalCents = cents(d.totalCents) ?? (deliveryCents === null ? null : itemsCents + deliveryCents);
  if (totalCents === null) problems.push('Order total is missing.');
  else if (deliveryCents !== null && totalCents !== itemsCents + deliveryCents) problems.push('Order total does not equal items plus delivery.');
  const customer = {name: text(d.customerName), phone: text(d.phone), email: text(d.email)};
  if (!customer.name || !customer.phone) problems.push('Customer name or phone is missing.');
  const address = Array.isArray(d.deliveryAddress) ? d.deliveryAddress.map(text).filter(Boolean) : [text(d.deliveryAddress), text(d.city), text(d.postcode)].filter(Boolean);
  if (method === 'DELIVERY' && address.length < 2) problems.push('Delivery address is incomplete.');
  if (problems.length) return {ok: false, problems};
  return {ok: true, value: {id: row.id, reference: row.reference, paidAt: text(d.paidAt) || null, paymentRef: text(d.paymentRef) || null, customer, delivery: {method, address}, items, deliveryCents: deliveryCents!, totalCents: totalCents!}};
}

export function marginSummary(o: PaidOrder, fees: FeeConfig) {
  const known = o.items.filter(i => i.supplierCostCents !== null);
  const allKnown = known.length === o.items.length;
  const supplierCents = known.reduce((n, i) => n + i.quantity * i.supplierCostCents!, 0);
  const itemsCents = o.items.reduce((n, i) => n + i.quantity * i.unitPriceCents, 0);
  const grossCents = allKnown ? itemsCents - supplierCents : null;
  const feeCents = fees.percent === null && fees.fixedCents === null ? null : Math.round((o.totalCents * (fees.percent ?? 0)) / 100) + (fees.fixedCents ?? 0);
  return {itemsCents, supplierCents: allKnown ? supplierCents : null, grossCents, feeCents, afterFeeCents: grossCents !== null && feeCents !== null ? grossCents - feeCents : null,
    belowCost: o.items.filter(i => i.supplierCostCents !== null && i.unitPriceCents <= i.supplierCostCents!).map(i => i.name)};
}

export function warnings(o: PaidOrder, fees: FeeConfig) {
  const m = marginSummary(o, fees), out: string[] = [];
  if (o.delivery.method === 'COLLECTION') out.push('The customer chose collection. Perfect Dealz delivers; agree how this order will be fulfilled before buying.');
  if (m.supplierCents === null) out.push('Supplier price was not recorded for every item. Check the live Perfect Dealz price before buying.');
  for (const n of m.belowCost) out.push(`"${n}" sold at or below the supplier price recorded for it.`);
  if (!o.customer.email) out.push('No customer email on file; use the phone number for tracking updates.');
  return out;
}

export const checklist = (o: PaidOrder) => [
  'Confirm stock with Perfect Dealz for every item (their stock is held at an outside warehouse). If anything is unavailable, contact the customer and refund that part.',
  'Check the live Perfect Dealz price for each item against the price paid here. If it has gone up, note the lost margin.',
  `Place and pay the order on perfectdealz.co.za. ${o.delivery.method === 'DELIVERY' ? 'Use the customer\'s delivery address above, not ours.' : 'Customer chose collection: agree the delivery address first.'}`,
  `Compare Perfect Dealz's delivery fee at checkout with the ${rand(o.deliveryCents)} collected from the customer.`,
  'Ask for blank, no-price packaging.',
  `Record the Perfect Dealz order reference against ${o.reference}.`,
  'Send the customer the courier tracking when it arrives.',
];

export function buildAlert(o: PaidOrder, fees: FeeConfig, resend = false) {
  const m = marginSummary(o, fees), warn = warnings(o, fees);
  const row = (label: string, value: string) => `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;vertical-align:top;white-space:nowrap;">${esc(label)}</td><td style="padding:4px 0;color:#171B20;">${value}</td></tr>`;
  const lines = o.items.map(i => `<tr><td style="padding:8px 8px 8px 0;border-bottom:1px solid #eceef0;"><strong>${esc(i.name)}</strong>${i.option && i.option !== 'Standard' ? `<br><span style="color:#6b7280;">${esc(i.option)}</span>` : ''}${i.supplierUrl ? `<br><a href="${esc(i.supplierUrl)}" style="color:#DA292B;">Open at Perfect Dealz</a>` : ''}</td><td style="padding:8px;border-bottom:1px solid #eceef0;text-align:center;">${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eceef0;text-align:right;white-space:nowrap;">${rand(i.unitPriceCents)}</td><td style="padding:8px 0 8px 8px;border-bottom:1px solid #eceef0;text-align:right;white-space:nowrap;">${i.supplierCostCents === null ? 'not recorded' : rand(i.supplierCostCents)}</td></tr>`).join('');
  const money = [
    row('Customer paid', `<strong>${rand(o.totalCents)}</strong> (items ${rand(m.itemsCents)} + delivery ${rand(o.deliveryCents)})`),
    row('Supplier price (items)', m.supplierCents === null ? 'incomplete' : rand(m.supplierCents)),
    row('Gross margin on items', m.grossCents === null ? 'incomplete' : rand(m.grossCents)),
    row('Payfast fee', m.feeCents === null ? 'rates not configured' : rand(m.feeCents)),
    row('Margin after Payfast fee', m.afterFeeCents === null ? 'not available' : `<strong>${rand(m.afterFeeCents)}</strong>`),
  ].join('');
  const steps = checklist(o).map(s => `<li style="margin:0 0 8px;">${esc(s)}</li>`).join('');
  const warn_ = warn.length ? `<div style="margin:0 0 20px;padding:14px 16px;border-radius:8px;background:#fff4f4;border:1px solid #f3c4c5;color:#7a1214;"><strong>Check before buying</strong><ul style="margin:8px 0 0 18px;padding:0;">${warn.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>` : '';
  const content = `<h1 style="margin:0 0 6px;font-size:22px;color:#171B20;">${resend ? 'Reminder: ' : ''}Paid order ${esc(o.reference)}</h1>${paragraph(`Payment is confirmed. Buy this from Perfect Dealz${o.paidAt ? ` (paid ${esc(o.paidAt)})` : ''}.`)}${warn_}
<h2 style="font-size:16px;margin:20px 0 8px;">Customer</h2><table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px;">${row('Name', esc(o.customer.name))}${row('Phone', esc(o.customer.phone))}${row('Email', o.customer.email ? esc(o.customer.email) : 'not given')}${row(o.delivery.method === 'DELIVERY' ? 'Deliver to' : 'Method', o.delivery.method === 'DELIVERY' ? o.delivery.address.map(esc).join('<br>') : 'Collection')}${o.paymentRef ? row('Payfast reference', esc(o.paymentRef)) : ''}</table>
<h2 style="font-size:16px;margin:24px 0 8px;">Items</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse;"><tr style="color:#6b7280;text-align:left;"><th style="padding:0 8px 6px 0;">Item</th><th style="padding:0 8px 6px;text-align:center;">Qty</th><th style="padding:0 8px 6px;text-align:right;">Sold at</th><th style="padding:0 0 6px 8px;text-align:right;">Supplier</th></tr>${lines}</table>
<h2 style="font-size:16px;margin:24px 0 8px;">Money</h2><table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px;">${money}</table>
<h2 style="font-size:16px;margin:24px 0 8px;">Fulfilment checklist</h2><ol style="margin:0 0 0 20px;padding:0;font-size:15px;line-height:1.5;color:#3a3f46;">${steps}</ol>`;
  return {subject: `${resend ? 'Reminder: ' : ''}Paid order ${o.reference}: ${rand(o.totalCents)}`, html: layout({preheader: `${o.customer.name} · ${rand(o.totalCents)} · buy from Perfect Dealz`, content}), brand: brand.name};
}

// Cash-on-delivery order requests for Tunisia. Pure: validation, pricing from the server's catalogue, and the staff alert.
// Money is integer millimes of TND (1 TND = 1000 millimes). The delivery fee is not invented here: Shipper's fees are
// not verified, so the team confirms it with the customer on the confirmation call.
export const governorates = ['Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba', 'Kairouan', 'Kasserine', 'Kébili', 'Le Kef', 'Mahdia', 'La Manouba', 'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan'] as const;

export type PricedProduct = {id: string; title: {en: string; fr: string; ar: string}; priceMillimes: number; stock: number; active: boolean};
export type Line = {id: string; quantity: number};
export type CodOrder = {
  requestKey: string; locale: 'en' | 'fr' | 'ar'; name: string; phone: string; governorate: string; delegation: string; address: string; notes: string;
  items: {id: string; title: string; quantity: number; unitMillimes: number}[]; subtotalMillimes: number;
};
export type Checked = {ok: true; order: CodOrder} | {ok: false; code: 'INVALID_DETAILS' | 'INVALID_CART' | 'OUT_OF_STOCK'; field?: string};

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** Tunisian numbers are 8 digits after +216; accepts 00216 / +216 / spaces. Returns +216XXXXXXXX or null. */
export function tunisianPhone(raw: unknown) {
  const digits = (typeof raw === 'string' ? raw : '').replace(/[^\d+]/g, '').replace(/^\+?(00)?216/, '').replace(/\D/g, '');
  return /^[2-9]\d{7}$/.test(digits) ? `+216${digits}` : null;
}

export function checkCodOrder(input: unknown, products: readonly PricedProduct[]): Checked {
  const b = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const key = typeof b.requestKey === 'string' && /^[A-Za-z0-9-]{16,64}$/.test(b.requestKey) ? b.requestKey : '';
  const name = text(b.name, 100), phone = tunisianPhone(b.phone), governorate = text(b.governorate, 40), delegation = text(b.delegation, 80);
  const address = text(b.address, 300), notes = text(b.notes, 300), locale = b.locale === 'fr' || b.locale === 'ar' ? b.locale : 'en';
  const bad = (field: string): Checked => ({ok: false, code: 'INVALID_DETAILS', field});
  if (!key) return bad('requestKey');
  if (name.length < 2) return bad('name');
  if (!phone) return bad('phone');
  if (!(governorates as readonly string[]).includes(governorate)) return bad('governorate');
  if (delegation.length < 2) return bad('delegation');
  if (address.length < 5) return bad('address');
  if (!Array.isArray(b.lines) || !b.lines.length || b.lines.length > 30) return {ok: false, code: 'INVALID_CART'};
  const merged = new Map<string, number>();
  for (const l of b.lines as Line[]) {
    if (typeof l?.id !== 'string' || !Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > 10) return {ok: false, code: 'INVALID_CART'};
    merged.set(l.id, (merged.get(l.id) ?? 0) + l.quantity);
  }
  const items: CodOrder['items'] = [];
  for (const [id, quantity] of merged) {
    const p = products.find(x => x.id === id);
    if (!p || !p.active || !(p.priceMillimes > 0) || !Number.isInteger(p.priceMillimes)) return {ok: false, code: 'INVALID_CART'};
    if (quantity > 10 || quantity > p.stock) return {ok: false, code: 'OUT_OF_STOCK'};
    items.push({id, title: p.title.fr || p.title.en, quantity, unitMillimes: p.priceMillimes});
  }
  return {ok: true, order: {requestKey: key, locale, name, phone, governorate, delegation, address, notes, items, subtotalMillimes: items.reduce((n, i) => n + i.quantity * i.unitMillimes, 0)}};
}

export const tnd = (millimes: number) => `${(millimes / 1000).toFixed(3)} TND`;
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]!));

/** The staff email: everything needed to call the customer and confirm. */
export function codAlert(reference: string, o: CodOrder) {
  const rows = o.items.map(i => `<tr><td style="padding:6px 8px 6px 0;border-bottom:1px solid #eee;">${esc(i.title)}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td><td style="padding:6px 0 6px 8px;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">${tnd(i.unitMillimes)}</td></tr>`).join('');
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#171B20;max-width:560px;"><h1 style="font-size:20px;margin:0 0 8px;">New cash-on-delivery order ${esc(reference)}</h1>
<p style="margin:0 0 16px;">Call the customer to confirm the order and the delivery fee <strong>before</strong> anything is dispatched. Nothing has been paid.</p>
<p style="margin:0 0 4px;"><strong>${esc(o.name)}</strong> &middot; <a href="tel:${esc(o.phone)}">${esc(o.phone)}</a> &middot; language: ${o.locale}</p>
<p style="margin:0 0 16px;">${esc(o.address)}<br>${esc(o.delegation)}, ${esc(o.governorate)}${o.notes ? `<br><em>Note: ${esc(o.notes)}</em>` : ''}</p>
<table style="width:100%;border-collapse:collapse;font-size:14px;"><tr style="text-align:left;color:#666;"><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th></tr>${rows}</table>
<p style="margin:16px 0 0;"><strong>Items total: ${tnd(o.subtotalMillimes)}</strong><br>Delivery fee: to be confirmed on the call. Cash to collect = items + confirmed delivery fee.</p></div>`;
  return {subject: `New COD order ${reference}: ${tnd(o.subtotalMillimes)} - ${o.name}`, html};
}

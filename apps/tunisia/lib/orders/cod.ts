// Cash-on-delivery order requests for Tunisia. Pure: validation, pricing from the server's catalogue, and the staff alert.
// Money is integer millimes of TND (1 TND = 1000 millimes). The delivery fee is not invented here: Shipper's fees are
// not verified, so the team confirms it with the customer on the confirmation call.
export const governorates = ['Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès', 'Gafsa', 'Jendouba', 'Kairouan', 'Kasserine', 'Kébili', 'Le Kef', 'Mahdia', 'La Manouba', 'Médenine', 'Monastir', 'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse', 'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan'] as const;

export type PricedProduct = {id: string; title: {en: string; fr: string; ar: string}; priceMillimes: number; stock: number; active: boolean};
export type Line = {id: string; quantity: number};
export type CodOrder = {
  requestKey: string; locale: 'en' | 'fr' | 'ar'; name: string; phone: string; governorate: string; delegation: string; address: string; notes: string; email: string;
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
  const address = text(b.address, 300), notes = text(b.notes, 300), email = text(b.email, 120).toLowerCase(), locale = b.locale === 'fr' || b.locale === 'ar' ? b.locale : 'en';
  const bad = (field: string): Checked => ({ok: false, code: 'INVALID_DETAILS', field});
  if (!key) return bad('requestKey');
  if (name.length < 2) return bad('name');
  if (!phone) return bad('phone');
  if (!(governorates as readonly string[]).includes(governorate)) return bad('governorate');
  if (delegation.length < 2) return bad('delegation');
  if (address.length < 5) return bad('address');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('email');
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
  return {ok: true, order: {requestKey: key, locale, name, phone, governorate, delegation, address, notes, email, items, subtotalMillimes: items.reduce((n, i) => n + i.quantity * i.unitMillimes, 0)}};
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

// The customer's copy, in the language they ordered in. Says "received", not "confirmed": staff still call to confirm the
// order and the delivery fee, and nothing has been paid. French and Arabic need a native-speaker review.
const confirmationCopy = {
  en: {subject: (r: string) => `We received your order ${r}`, hello: (n: string) => `Hello ${n},`, intro: 'Thank you for your order with Plentovo. We have received it.', next: 'What happens next', steps: ['We will call you on the number you gave to confirm your order and the delivery fee.', 'Nothing is sent until you confirm.', 'You pay in cash when your order arrives. Nothing has been charged online.'], ref: 'Order reference', item: 'Item', qty: 'Qty', price: 'Price', total: 'Items total', fee: 'Delivery fee: confirmed when we call you.', help: 'Questions? Reply to this email.', legal: 'Plentovo is a brand of Masaphokati Global Shelf (Pty) Ltd'},
  fr: {subject: (r: string) => `Nous avons bien reçu votre commande ${r}`, hello: (n: string) => `Bonjour ${n},`, intro: 'Merci pour votre commande chez Plentovo. Nous l’avons bien reçue.', next: 'La suite', steps: ['Nous vous appellerons au numéro indiqué pour confirmer votre commande et les frais de livraison.', 'Rien n’est expédié tant que vous n’avez pas confirmé.', 'Vous payez en espèces à la réception. Rien n’a été débité en ligne.'], ref: 'Référence de commande', item: 'Article', qty: 'Qté', price: 'Prix', total: 'Total des articles', fee: 'Frais de livraison : confirmés lors de notre appel.', help: 'Une question ? Répondez à cet e-mail.', legal: 'Plentovo est une marque de Masaphokati Global Shelf (Pty) Ltd'},
  ar: {subject: (r: string) => `استلمنا طلبك ${r}`, hello: (n: string) => `مرحبًا ${n}،`, intro: 'شكرًا لطلبك من Plentovo. لقد استلمناه.', next: 'ما الذي سيحدث الآن', steps: ['سنتصل بك على الرقم الذي زودتنا به لتأكيد طلبك ومصاريف التوصيل.', 'لن نرسل أي شيء قبل أن تؤكد.', 'تدفع نقدًا عند وصول طلبك. لم يتم خصم أي مبلغ عبر الإنترنت.'], ref: 'رقم الطلب', item: 'المنتج', qty: 'الكمية', price: 'السعر', total: 'مجموع المنتجات', fee: 'مصاريف التوصيل: نؤكدها عند الاتصال بك.', help: 'لديك سؤال؟ ردّ على هذه الرسالة.', legal: 'Plentovo علامة تجارية لشركة Masaphokati Global Shelf (Pty) Ltd'},
} as const;

export function codConfirmation(reference: string, o: CodOrder) {
  const c = confirmationCopy[o.locale], rtl = o.locale === 'ar', align = rtl ? 'right' : 'left', other = rtl ? 'left' : 'right';
  const rows = o.items.map(i => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:${align};">${esc(i.title)}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td><td dir="ltr" style="padding:6px 0;border-bottom:1px solid #eee;text-align:${other};white-space:nowrap;">${tnd(i.unitMillimes * i.quantity)}</td></tr>`).join('');
  const html = `<div dir="${rtl ? 'rtl' : 'ltr'}" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#171B20;max-width:560px;text-align:${align};"><a href="https://plentovo.com/tunisia/${o.locale}"><img src="https://plentovo.com/brand/plentovo-header.gif" alt="Plentovo" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0;margin:0 0 12px;"></a>
<p style="margin:12px 0 4px;">${esc(c.hello(o.name))}</p><p style="margin:0 0 16px;">${c.intro}</p>
<p style="margin:0 0 16px;">${c.ref}: <strong dir="ltr">${esc(reference)}</strong></p>
<table style="width:100%;border-collapse:collapse;font-size:14px;"><tr style="color:#666;"><th style="text-align:${align};">${c.item}</th><th>${c.qty}</th><th style="text-align:${other};">${c.price}</th></tr>${rows}</table>
<p style="margin:12px 0 0;"><strong>${c.total}: <span dir="ltr">${tnd(o.subtotalMillimes)}</span></strong><br>${c.fee}</p>
<p style="margin:20px 0 6px;font-weight:bold;">${c.next}</p><ul style="margin:0;padding-${rtl ? 'right' : 'left'}:20px;">${c.steps.map(x => `<li>${x}</li>`).join('')}</ul>
<p style="margin:20px 0 0;">${c.help}</p><p style="margin:16px 0 0;font-size:12px;color:#8a8a8a;">${c.legal}</p></div>`;
  return {subject: c.subject(reference), html};
}

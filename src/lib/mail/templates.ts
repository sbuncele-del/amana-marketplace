import {siteUrl} from '@/lib/site';
import {button, esc, layout, paragraph} from './layout';

export const unsubscribeLink = (token: string) => `${siteUrl}/newsletter/unsubscribe?token=${token}`;
export const oneClickUnsubscribe = (token: string) => `${siteUrl}/api/marketing/unsubscribe?token=${token}`;
export const confirmLink = (token: string) => `${siteUrl}/api/marketing/confirm?token=${token}`;

const heading = (text: string) => `<h1 style="margin:0 0 18px;font-size:26px;line-height:1.25;color:#171B20;">${esc(text)}</h1>`;

export function confirmSubscriptionEmail(token: string) {
  return {
    subject: 'Please confirm your Plentovo subscription',
    html: layout({
      preheader: 'One tap to confirm, then you are on the list.',
      content:
        heading('Confirm your email') +
        paragraph('Thanks for your interest in Plentovo. Confirm your email address and we will let you know about new arrivals, launch news and good deals.') +
        button('Confirm my email', confirmLink(token)) +
        paragraph('<span style="font-size:14px;color:#6b7280;">If you did not ask for this, ignore this message and nothing will happen. You will not be subscribed.</span>'),
    }),
  };
}

export type WelcomeProduct = {name: string; slug: string; image: string; price: number; currency: string; department?: string};
export function welcomeEmail(token: string, products: WelcomeProduct[] = [], market: string | null = null, discovery=false) {
  const valid = market === 'ZA' ? products.filter(p => {
    if (p.currency !== 'ZAR' || !Number.isFinite(p.price) || p.price <= 0) return false;
    try { return new URL(p.image, siteUrl).protocol === 'https:'; } catch { return false; }
  }).filter((p, i, all) => all.findIndex(other => other.slug === p.slug) === i).slice(0, 12) : [];
  const card = (p: WelcomeProduct) => {
    const href = `${siteUrl}/product/${encodeURIComponent(p.slug)}`;
    const price = new Intl.NumberFormat('en-ZA', {style: 'currency', currency: p.currency}).format(p.price);
    return `<td class="product-column" width="50%" valign="top" style="width:50%;padding:10px 8px 24px;vertical-align:top;"><a href="${esc(href)}" style="color:#171B20;text-decoration:none;"><img class="email-product-image" src="${esc(new URL(p.image, siteUrl).href)}" alt="${esc(p.name)}" width="240" height="180" style="display:block;width:100%;height:180px;object-fit:contain;background:#f7f6f3;border-radius:10px;border:0;"><p style="margin:14px 0 7px;font-size:11px;line-height:1.4;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">${esc(p.department || 'Everyday finds')}</p><h3 style="margin:0 0 10px;font-size:16px;line-height:1.4;font-weight:600;">${esc(p.name)}</h3><p style="font-size:20px;font-weight:800;margin:0 0 12px;color:#171B20;">From ${esc(price)}</p><span style="font-size:14px;font-weight:700;color:#DA292B;">Explore this find →</span></a></td>`;
  };
  const cards = Array.from({length: Math.ceil(valid.length / 2)}, (_, i) => `<tr>${valid.slice(i * 2, i * 2 + 2).map(card).join('')}${valid.length === i * 2 + 1 ? '<td class="product-column" width="50%"></td>' : ''}</tr>`).join('');
  return {
    subject: discovery?'Good finds for the things you are exploring':'Welcome to Plentovo — make room for good things',
    html: layout({
      preheader: 'Good things. Plenty of choice.',
      unsubscribeUrl: unsubscribeLink(token),
      content:
        heading(discovery?'Keep exploring good things':'Welcome to Plentovo') +
        paragraph(discovery?'Here are relevant finds based on products you explored on Plentovo. Compare the options and choose what works for you.':'You are confirmed. Expect an occasional email from us with new arrivals, useful finds and offers worth opening. No clutter, and never your details passed on.') +
        (cards ? heading('Selected for you') + paragraph('Explore good finds for your home, family and everyday life, across our South African departments.') + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cards}</table>` + paragraph('<span style="font-size:12px;color:#6b7280;">Prices and availability were checked when this email was prepared and may change. Check the product page for current details.</span>') : paragraph(market === 'ZA' ? 'Explore our South African range for your next everyday find.' : 'Choose your shopping country on Plentovo to explore the available range. We will share local recommendations as they become available.')) +
        button('Browse Plentovo', `${siteUrl}/browse`),
    }),
  };
}

export function supportAlertEmail(c: {reference: string; subject: string; name: string; phone: string; preference: string; message: string}) {
  const row = (k: string, v: string) => `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-size:14px;vertical-align:top;">${k}</td><td style="padding:6px 0;font-size:14px;color:#171B20;">${v}</td></tr>`;
  return {
    subject: `New customer enquiry · ${c.subject} · ${c.reference}`,
    html: layout({
      preheader: `${c.name} wrote in: ${c.subject}`,
      content:
        heading('New customer enquiry') +
        `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">${row('Reference', esc(c.reference))}${row('Topic', esc(c.subject))}${row('Name', esc(c.name))}${row('Phone', esc(c.phone))}${row('Prefers', c.preference === 'CALL' ? 'A phone call' : 'WhatsApp')}</table>` +
        `<div style="padding:16px;background:#f7f7f8;border-radius:10px;font-size:15px;line-height:1.6;color:#3a3f46;white-space:pre-wrap;">${esc(c.message)}</div>` +
        button('Open the operations centre', `${siteUrl}/operations`) +
        paragraph('<span style="font-size:13px;color:#6b7280;">Customer care aims to respond within 24 hours.</span>'),
    }),
  };
}

/** Campaign body: blank-line separated paragraphs, single newlines become line breaks. */
export function campaignEmail(c: {subject: string; preheader: string; body: string; ctaLabel?: string | null; ctaUrl?: string | null; token: string}) {
  const paragraphs = c.body.trim().split(/\n{2,}/).map(p => paragraph(esc(p).replace(/\n/g, '<br>'))).join('');
  return {
    subject: c.subject,
    html: layout({
      preheader: c.preheader,
      unsubscribeUrl: unsubscribeLink(c.token),
      content: heading(c.subject) + paragraphs + (c.ctaLabel && c.ctaUrl ? button(c.ctaLabel, c.ctaUrl) : ''),
    }),
  };
}

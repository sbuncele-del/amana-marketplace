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

export type WelcomeProduct = {name: string; slug: string; image: string; price: number; currency: string};
export function welcomeEmail(token: string, products: WelcomeProduct[] = [], market: string | null = null) {
  const cards = market === 'ZA' ? products.filter(p => p.currency === 'ZAR' && Number.isFinite(p.price) && p.price > 0).slice(0, 4).map(p => {
    const href = `${siteUrl}/product/${encodeURIComponent(p.slug)}`;
    let image: URL;
    try { image = new URL(p.image, siteUrl); } catch { return ''; }
    if (!['https:', 'http:'].includes(image.protocol)) return '';
    const price = new Intl.NumberFormat('en-ZA', {style: 'currency', currency: p.currency}).format(p.price);
    return `<tr><td style="padding:20px 0;border-bottom:1px solid #eceef0;"><a href="${esc(href)}"><img src="${esc(image.href)}" alt="${esc(p.name)}" width="220" style="display:block;width:100%;max-width:220px;height:auto;margin:0 auto 16px;"></a><h3 style="margin:0 0 8px;font-size:18px;">${esc(p.name)}</h3><p style="font-size:18px;font-weight:700;margin:0;">From ${esc(price)}</p>${button('Explore this find', href)}</td></tr>`;
  }).join('') : '';
  return {
    subject: 'Welcome to Plentovo — make room for good things',
    html: layout({
      preheader: 'Good things. Plenty of choice.',
      unsubscribeUrl: unsubscribeLink(token),
      content:
        heading('Welcome to Plentovo') +
        paragraph('You are confirmed. Expect an occasional email from us with new arrivals, useful finds and offers worth opening. No clutter, and never your details passed on.') +
        (cards ? heading('Good finds to get you started') + paragraph('A few recommendations from our South African range, chosen to bring more ease and joy to your everyday.') + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cards}</table>` + paragraph('<span style="font-size:12px;color:#6b7280;">Prices and availability were checked when this email was prepared and may change. Check the product page for current details.</span>') : paragraph(market === 'ZA' ? 'Explore our South African range for your next everyday find.' : 'Choose your shopping country on Plentovo to explore the available range. We will share local recommendations as they become available.')) +
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

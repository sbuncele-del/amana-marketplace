import {orderTrackingLink} from '@/lib/order-tracking-link';
import {siteUrl} from '@/lib/site';
import {button, esc, layout, paragraph} from './layout';

export const orderMilestones = {
  PAID: 'Payment confirmed',
  SHIPPED: 'Order shipped',
  DELIVERED: 'Order delivered',
} as const;
type Milestone = keyof typeof orderMilestones;

function greeting(name?: string) {
  const firstName = name?.trim().split(/\s+/)[0];
  return firstName && !firstName.includes('@') ? `Hi ${firstName},` : 'Hello,';
}

function orderMessage(name: string | undefined, title: string, description: string, reference: string, action: {label: string; href: string}, tracking?: string) {
  return layout({preheader: description, content:
    `<h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#171B20;">${esc(title)}</h1>` +
    paragraph(esc(greeting(name))) + paragraph(esc(description)) +
    paragraph(`Order reference: <strong>${esc(reference)}</strong>`) +
    (tracking ? paragraph(`Courier tracking number: <strong>${esc(tracking)}</strong>`) : '') +
    button(action.label, action.href) + paragraph('Need a hand? Reply to this email and our Orders team will help.'),
  });
}

export function eftOrderReceivedEmail(reference: string, name?: string) {
  return {
    subject: `Plentovo order received — ${reference}`,
    html: orderMessage(name, 'Order received', 'Thank you for choosing Plentovo. We’ve received your order. Please use the reference below when making your EFT payment.', reference,
      {label: 'View order and EFT details', href: `${siteUrl}/checkout/eft/${encodeURIComponent(reference)}`}),
  };
}

export function orderMilestoneEmail(milestone: Milestone, reference: string, {name, collection, trackingNumber, trackingUrl}: {name?: string; collection: boolean; trackingNumber?: string; trackingUrl?: string}) {
  const label = milestone === 'DELIVERED' && collection ? 'Order collected' : orderMilestones[milestone];
  const tracking = milestone === 'SHIPPED' ? orderTrackingLink(trackingUrl) : undefined;
  const description = milestone === 'PAID' ? 'Your payment is confirmed. Thank you. We’ll get your order ready and let you know when it’s on its way.'
    : milestone === 'SHIPPED' ? 'Your order is on its way. We’ve handed it to the courier and included the tracking details below.'
    : collection ? 'Your order has been collected. We hope you enjoy it. Thank you for choosing Plentovo.'
      : 'The courier has marked your order as delivered. We hope you enjoy it. If you can’t find your parcel, please reply so we can help.';
  return {
    label,
    subject: `${label} | Plentovo ${reference}`,
    html: orderMessage(name, label, description, reference, tracking ? {label: 'Track your parcel', href: tracking} : {label: 'Get order help', href: `${siteUrl}/track`},
      milestone === 'SHIPPED' ? trackingNumber : undefined),
  };
}

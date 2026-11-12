import {siteUrl} from '@/lib/site';
import {button, esc, layout, paragraph} from './layout';

export const orderMilestones = {
  PAID: 'Payment confirmed',
  SHIPPED: 'Order shipped',
  DELIVERED: 'Order delivered',
} as const;
type Milestone = keyof typeof orderMilestones;

function orderMessage(title: string, description: string, reference: string, action: {label: string; href: string}, tracking?: string) {
  return layout({preheader: description, content:
    `<h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#171B20;">${esc(title)}</h1>` +
    paragraph(esc(description)) +
    paragraph(`Order reference: <strong>${esc(reference)}</strong>`) +
    (tracking ? paragraph(`Courier tracking number: <strong>${esc(tracking)}</strong>`) : '') +
    button(action.label, action.href),
  });
}

export function eftOrderReceivedEmail(reference: string) {
  return {
    subject: `Plentovo order received — ${reference}`,
    html: orderMessage('Order received', 'Thanks for shopping with Plentovo. Use your order reference when making your EFT payment.', reference,
      {label: 'View order and EFT details', href: `${siteUrl}/checkout/eft/${encodeURIComponent(reference)}`}),
  };
}

export function orderMilestoneEmail(milestone: Milestone, reference: string, {collection, trackingNumber}: {collection: boolean; trackingNumber?: string}) {
  const label = milestone === 'DELIVERED' && collection ? 'Order collected' : orderMilestones[milestone];
  const description = milestone === 'PAID' ? 'We’ve confirmed your payment and will prepare your order.'
    : milestone === 'SHIPPED' ? 'Your order has been handed to the courier.'
    : collection ? 'Your order has been collected. Thank you for shopping with Plentovo.'
      : 'Your order has been marked as delivered. Thank you for shopping with Plentovo.';
  return {
    label,
    subject: `${label} | Plentovo ${reference}`,
    html: orderMessage(label, description, reference, {label: 'Get order help', href: `${siteUrl}/track`},
      milestone === 'SHIPPED' ? trackingNumber : undefined),
  };
}

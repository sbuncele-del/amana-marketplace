import {z} from 'zod';

export const quoteTeam = 'za-customer-care';
const text = (max: number) => z.string().trim().max(max);
const cents = z.number().int().min(0).max(100_000_000);
const line = z.object({
  name: text(200).min(2),
  quantity: z.number().int().min(1).max(10000),
  option: text(100).optional(),
  sku: text(100).optional(),
});
export const quoteAction = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('create'), requestKey: z.string().uuid(),
    customerName: text(100).min(2), email: text(254).email().or(z.literal('')),
    phone: text(40), city: text(150), deliveryTerms: text(2000), note: text(2000),
    items: z.array(line).min(1).max(50),
  }),
  z.object({
    action: z.literal('price'), id: z.string().uuid(), version: z.number().int().positive(),
    supplier: text(150).min(2), supplierOffer: text(500),
    freightProvider: text(150), freightOffer: text(500), freightCostCents: cents, shippingCents: cents,
    deliveryTerms: text(2000).min(2), expiry: z.iso.date(),
    prices: z.array(z.object({unitPriceCents: cents.min(1), unitCostCents: cents})).min(1).max(50),
  }),
  z.object({
    action: z.literal('accept'), id: z.string().uuid(), version: z.number().int().positive(),
    note: text(2000).min(3),
  }),
]);

export type QuotePricing = {
  supplier: string; supplierOffer: string; freightProvider: string; freightOffer: string;
  freightCostCents: number; deliveryTerms: string; expiry: string; unitCosts: number[]; marginCents: number;
};

export function quoteDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {timeZone: 'Africa/Johannesburg', year: 'numeric', month: '2-digit', day: '2-digit'}).format(now);
}

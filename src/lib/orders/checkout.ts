// Builds a South African order from a cart on the server. The browser only says which variants and how many;
// prices, delivery fee, stock and supplier cost are all looked up here, never taken from the request.
import {deliveryFee} from '@/lib/delivery-rates';
import type {Pairs} from '@/lib/payfast/signature';
import type {PayfastConfig} from '@/lib/payfast/config';

export type CartLine = {id: string; quantity: number};
export type Address = {fullName: string; phone: string; street: string; city: string; state: string | null; zip: string | null};
export type CatalogueVariant = {id: string; title: string; price: number; supplierAvailable: boolean; weightGrams?: number; managedStock?: number};
export type CatalogueItem = {slug: string; name: string; variants: CatalogueVariant[]};
export type CheckoutDeps = {
  product: (slug: string) => Promise<CatalogueItem | null>;
  supplierPrice: (slug: string, variant: CatalogueVariant) => Promise<number | null>;
};
export type Built = {ok: true; totalCents: number; data: Record<string, unknown>} | {ok: false; error: string};

const cents = (rand: number) => Math.round(rand * 100);
const fail = (error: string): Built => ({ok: false, error});

export async function buildCheckoutOrder(
  input: {lines: unknown; method: 'DELIVERY' | 'COLLECTION'; address: Address | null; userId: string; email: string; checkoutKey: string},
  deps: CheckoutDeps,
): Promise<Built> {
  if (!Array.isArray(input.lines) || !input.lines.length || input.lines.length > 50) return fail('Your cart is empty or invalid.');
  const merged = new Map<string, number>();
  for (const l of input.lines as CartLine[]) {
    if (typeof l?.id !== 'string' || !Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > 10) return fail('Your cart is empty or invalid.');
    merged.set(l.id, Math.min(10, (merged.get(l.id) ?? 0) + l.quantity));
  }
  const a = input.address;
  if (!a || !a.fullName.trim() || !a.phone.trim()) return fail('Choose a delivery address with a name and contact number.');
  if (input.method === 'DELIVERY' && (!a.street.trim() || !a.city.trim() || !(a.zip ?? '').trim())) return fail('Your delivery address is incomplete.');

  const items: Record<string, unknown>[] = [], weighed: {quantity: number; weightGrams: number | undefined}[] = [];
  for (const [id, quantity] of merged) {
    const [slug, variantId] = id.split(':');
    const product = slug ? await deps.product(slug) : null, variant = product?.variants.find(v => v.id === variantId);
    if (!product || !variant || !variant.supplierAvailable || !(variant.price > 0)) return fail('An item in your cart is no longer available. Please review your cart.');
    if (variant.managedStock !== undefined && quantity > variant.managedStock) return fail(`Only ${variant.managedStock} of "${product.name}" left. Please reduce the quantity.`);
    const cost = await deps.supplierPrice(product.slug, variant);
    items.push({id, slug: product.slug, name: product.name, option: variant.title, quantity, unitPriceCents: cents(variant.price), ...(cost && cost > 0 ? {supplierCostCents: cents(cost)} : {})});
    weighed.push({quantity, weightGrams: variant.weightGrams});
  }
  const shipping = deliveryFee(weighed, input.method);
  if (shipping === null) return fail('We could not work out delivery for these items. Please contact customer care.');
  const subtotalCents = items.reduce((n, i) => n + (i.quantity as number) * (i.unitPriceCents as number), 0), shippingCents = cents(shipping);
  const totalCents = subtotalCents + shippingCents;
  return {
    ok: true, totalCents,
    data: {
      country: 'ZA', currency: 'ZAR', source: 'CHECKOUT', paymentProvider: 'PAYFAST', awaitingPayment: true, paymentVerified: false,
      userId: input.userId, checkoutKey: input.checkoutKey, customerName: a.fullName.trim(), phone: a.phone.trim(), email: input.email,
      city: a.city.trim(), postcode: (a.zip ?? '').trim(), deliveryMethod: input.method,
      deliveryAddress: input.method === 'DELIVERY' ? [a.street.trim(), [a.city.trim(), a.state ?? ''].filter(Boolean).join(', '), (a.zip ?? '').trim()].filter(Boolean) : [],
      items, subtotalCents, shippingCents, totalCents,
    },
  };
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** The ordered, unsigned form fields Payfast expects. Order matters for the signature. */
export function payfastFields(o: {reference: string; totalCents: number; name: string; email: string; phone: string; itemNames: string[]}, cfg: PayfastConfig): Pairs {
  const [first, ...rest] = o.name.trim().split(/\s+/), cell = o.phone.replace(/\D/g, '').replace(/^27/, '0');
  const ref = encodeURIComponent(o.reference);
  return [
    ['merchant_id', cfg.merchantId], ['merchant_key', cfg.merchantKey],
    ['return_url', `${cfg.siteUrl}/checkout/return?ref=${ref}`], ['cancel_url', `${cfg.siteUrl}/checkout/cancelled?ref=${ref}`], ['notify_url', `${cfg.siteUrl}/api/payfast/itn`],
    ['name_first', clip(first ?? '', 100)], ['name_last', clip(rest.join(' '), 100)], ['email_address', o.email],
    ['cell_number', /^0\d{9}$/.test(cell) ? cell : ''],
    ['m_payment_id', o.reference], ['amount', (o.totalCents / 100).toFixed(2)],
    ['item_name', clip(`Plentovo order ${o.reference}`, 100)], ['item_description', clip(o.itemNames.join(', '), 255)],
  ];
}

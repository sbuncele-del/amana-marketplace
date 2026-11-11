import {createHash} from 'node:crypto';
import {after, NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {auth} from '@/lib/auth';
import {getCatalogueProduct} from '@/lib/catalogue';
import {deliveryFee} from '@/lib/delivery-rates';
import {eftBankDetails} from '@/lib/eft';
import {sameRequestOrigin} from '@/lib/experience/request-origin';
import {ensureExperienceSchema, experiencePool, transaction, insertRecord, event} from '@/lib/experience/store';
import {limitPublicRequest} from '@/lib/experience/public-rate-limit';
import {sendMail} from '@/lib/mail/send';
import {siteUrl} from '@/lib/site';
import {prisma} from '@/lib/prisma';

export const maxDuration = 60;
const schema = z.object({
  requestKey: z.string().uuid(),
  addressId: z.string().max(100).nullable(),
  method: z.enum(['DELIVERY', 'COLLECTION']),
  totalCents: z.number().int().positive(),
  lines: z.array(z.object({id: z.string().max(250).regex(/^[^:]+:[^:]+$/), quantity: z.number().int().min(1).max(10)})).min(1).max(50),
}).refine(order => new Set(order.lines.map(line => line.id)).size === order.lines.length);

export async function POST(request: NextRequest) {
  const fail = (error: string, status: number) => NextResponse.json({error}, {status});
  if (!sameRequestOrigin(request) || !request.headers.get('content-type')?.includes('application/json')) return fail('Please place your order from checkout.', 403);
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email) return fail('Please sign in to place your order.', 401);
  if (!eftBankDetails()) return fail('EFT is temporarily unavailable. Please contact Plentovo.', 503);

  function respond(reference: string) {
    const alerts = process.env.PLENTOVO_EFT_ORDER_EMAIL;
    after(async () => {
      const results = await Promise.allSettled([
        sendMail({to: user!.email!, subject: `Plentovo order received — ${reference}`,
          html: `<p>We received your order. Use ${reference} as your EFT reference.</p><p><a href="${siteUrl}/checkout/eft/${reference}">View your items, total and payment instructions</a></p>`,
          idempotencyKey: `eft-customer-${reference}`}),
        ...(alerts ? [sendMail({to: alerts, subject: `New EFT order — ${reference}`,
          html: `<p>Order ${reference} is awaiting EFT. <a href="${siteUrl}/operations">Open Operations</a> to view its items and verify the bank transfer.</p>`,
          idempotencyKey: `eft-staff-${reference}`})] : []),
      ]);
      if (results.some(result => result.status === 'rejected')) console.warn('EFT order email failed', reference);
    });
    return NextResponse.json({reference}, {status: 201, headers: {'Cache-Control': 'no-store'}});
  }

  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return fail('Check your cart and delivery details.', 400);
    const order = parsed.data;
    const key = createHash('sha256').update(`eft:${user.id}:${order.requestKey}`).digest('hex');
    const hash = createHash('sha256').update(JSON.stringify(order)).digest('hex');
    await ensureExperienceSchema();
    const lookup = 'SELECT k.request_hash,r.reference FROM experience_request_keys k JOIN experience_records r ON r.id=k.record_id WHERE k.key=$1';
    const existing = (await experiencePool().query(lookup, [key])).rows[0];
    if (existing) {
      if (existing.request_hash !== hash) return fail('Your checkout details changed. Please try again.', 409);
      return respond(existing.reference);
    }
    await limitPublicRequest(request, 'eft');
    const address = order.method === 'DELIVERY' && order.addressId
      ? await prisma.address.findFirst({where: {id: order.addressId, userId: user.id, country: 'South Africa'}})
      : null;
    if (order.method === 'DELIVERY' && !address) return fail('Choose a South African delivery address.', 400);

    const products = new Map<string, ReturnType<typeof getCatalogueProduct>>();
    const items = await Promise.all(order.lines.map(async line => {
      const [slug, id] = line.id.split(':');
      if (!products.has(slug)) products.set(slug, getCatalogueProduct(slug, true, false, undefined, 6000));
      const product = await products.get(slug);
      const variant = product?.variants.find(option => option.id === id);
      if (!product || !variant?.supplierAvailable || (variant.managedStock !== undefined && line.quantity > variant.managedStock)) return null;
      const unitPriceCents = Math.round(variant.price * 100);
      if (!Number.isSafeInteger(unitPriceCents) || unitPriceCents <= 0) return null;
      return {...line, slug, sku: product.sku, name: product.name, option: variant.title, unitPriceCents, weightGrams: variant.weightGrams};
    }));
    if (items.some(item => item === null)) return fail('An item’s availability changed. Please refresh your cart.', 409);
    const confirmedItems = items.filter(item => item !== null);
    const shipping = deliveryFee(confirmedItems, order.method);
    if (shipping === null) return fail('Delivery needs a manual quote for this cart. Please contact Plentovo or choose collection.', 409);
    const shippingCents = Math.round(shipping * 100);
    const subtotalCents = confirmedItems.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
    if (subtotalCents + shippingCents !== order.totalCents) return fail('Your order total changed. Please refresh your cart and check the new total.', 409);

    const reference = await transaction(async client => {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [key]);
      const prior = (await client.query(lookup, [key])).rows[0];
      if (prior) {
        if (prior.request_hash !== hash) throw new Error('REQUEST_CHANGED');
        return prior.reference as string;
      }
      const record = await insertRecord(client, {
        kind: 'ORDER', status: 'CONFIRMED',
        referencePrefix: (confirmedItems.length === 1 ? (confirmedItems[0].sku || confirmedItems[0].slug).replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase() : 'CART') || 'EFT',
        data: {customerId: user.id, customerName: address?.fullName || user.name || user.email,
          email: user.email, phone: address?.phone, city: address?.city, postcode: address?.zip,
          deliveryAddress: address && {street: address.street, city: address.city, state: address.state, postcode: address.zip},
          deliveryMethod: order.method, items: confirmedItems, subtotalCents, shippingCents,
          paymentMethod: 'EFT', country: 'ZA', currency: 'ZAR', source: 'STOREFRONT'},
      });
      await event(client, record.id, null, 'EFT_ORDER_RECEIVED', 'Awaiting cleared bank transfer. Verify the amount and order reference before marking paid.');
      await client.query('INSERT INTO experience_request_keys(key,request_hash,record_id) VALUES($1,$2,$3)', [key, hash, record.id]);
      return record.reference;
    });
    return respond(reference);
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMIT') return fail('Please wait before placing another order.', 429);
    if (error instanceof Error && error.message === 'REQUEST_CHANGED') return fail('Your checkout details changed. Please try again.', 409);
    return fail('We couldn’t confirm the order. Please retry before making a payment.', 503);
  }
}

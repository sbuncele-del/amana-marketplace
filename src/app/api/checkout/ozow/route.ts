import {catalogueOrderPhoto} from '@/lib/order-item-image';
import {createHash} from 'node:crypto';
import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {auth} from '@/lib/auth';
import {getCatalogueProduct} from '@/lib/catalogue';
import {deliveryFee} from '@/lib/delivery-rates';
import {sameRequestOrigin} from '@/lib/experience/request-origin';
import {ensureExperienceSchema, experiencePool, transaction, insertRecord, event} from '@/lib/experience/store';
import {limitPublicRequest} from '@/lib/experience/public-rate-limit';
import {createOzowPayment, ozowConfig} from '@/lib/ozow';
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

const noStore = {'Cache-Control': 'no-store'};
export async function GET() {
  return NextResponse.json({enabled: ozowConfig() !== null}, {headers: noStore});
}

// Pay by Bank with Ozow. Mirrors the EFT checkout: same availability and price checks, same order
// record, but the order is only marked PAID by the verified Ozow webhook, never by this route.
export async function POST(request: NextRequest) {
  const fail = (error: string, status: number) => NextResponse.json({error}, {status, headers: noStore});
  const config = ozowConfig();
  if (!config) return fail('Pay by Bank is not available yet. Please choose EFT.', 503);
  if (!sameRequestOrigin(request) || !request.headers.get('content-type')?.includes('application/json')) return fail('Please place your order from checkout.', 403);
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email) return fail('Please sign in to place your order.', 401);

  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return fail('Check your cart and delivery details.', 400);
    const order = parsed.data;
    const key = createHash('sha256').update(`ozow:${user.id}:${order.requestKey}`).digest('hex');
    const hash = createHash('sha256').update(JSON.stringify(order)).digest('hex');
    await ensureExperienceSchema();
    const lookup = 'SELECT k.request_hash,r.id,r.reference,r.status,r.data FROM experience_request_keys k JOIN experience_records r ON r.id=k.record_id WHERE k.key=$1';
    let existing = (await experiencePool().query(lookup, [key])).rows[0];
    if (existing && existing.request_hash !== hash) return fail('Your checkout details changed. Please try again.', 409);
    if (!existing) {
      await limitPublicRequest(request, 'ozow');
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
        const photo = catalogueOrderPhoto(product, variant.id);
        return {...line, image: photo?.url, variantImage: photo?.variant, slug, sku: product.sku, name: product.name, option: variant.title, unitPriceCents, weightGrams: variant.weightGrams};
      }));
      if (items.some(item => item === null)) return fail('An item’s availability changed. Please refresh your cart.', 409);
      const confirmedItems = items.filter(item => item !== null);
      const shipping = deliveryFee(confirmedItems, order.method);
      if (shipping === null) return fail('Delivery needs a manual quote for this cart. Please contact Plentovo or choose collection.', 409);
      const shippingCents = Math.round(shipping * 100);
      const subtotalCents = confirmedItems.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
      if (subtotalCents + shippingCents !== order.totalCents) return fail('Your order total changed. Please refresh your cart and check the new total.', 409);

      const notificationName = user.name || address?.fullName || undefined;
      existing = await transaction(async client => {
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [key]);
        const prior = (await client.query(lookup, [key])).rows[0];
        if (prior) { if (prior.request_hash !== hash) throw new Error('REQUEST_CHANGED'); return prior; }
        const record = await insertRecord(client, {
          kind: 'ORDER', status: 'CONFIRMED',
          referencePrefix: (confirmedItems.length === 1 ? (confirmedItems[0].sku || confirmedItems[0].slug).replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase() : 'CART') || 'OZW',
          data: {customerId: user.id, notificationName, customerName: address?.fullName || user.name || user.email,
            email: user.email, phone: address?.phone, city: address?.city, postcode: address?.zip,
            deliveryAddress: address && {street: address.street, city: address.city, state: address.state, postcode: address.zip},
            deliveryMethod: order.method, items: confirmedItems, subtotalCents, shippingCents,
            paymentMethod: 'OZOW', country: 'ZA', currency: 'ZAR', source: 'STOREFRONT'},
        });
        await event(client, record.id, null, 'OZOW_PAYMENT_STARTED', 'Awaiting Ozow Pay by Bank confirmation. Marked paid only by the verified Ozow webhook.');
        await client.query('INSERT INTO experience_request_keys(key,request_hash,record_id) VALUES($1,$2,$3)', [key, hash, record.id]);
        return {id: record.id, reference: record.reference, status: 'CONFIRMED', data: {subtotalCents, shippingCents}};
      });
    }
    if (existing.status !== 'CONFIRMED') return NextResponse.json({reference: existing.reference, paid: true}, {headers: noStore});

    // Reuse a still-valid payment link; otherwise create a fresh payment for this order.
    const stored = existing.data as {ozowRedirectUrl?: string; ozowExpireAt?: string; ozowAttempts?: number; subtotalCents: number; shippingCents?: number};
    if (stored.ozowRedirectUrl && stored.ozowExpireAt && new Date(stored.ozowExpireAt).getTime() > Date.now() + 120_000)
      return NextResponse.json({reference: existing.reference, redirectUrl: stored.ozowRedirectUrl}, {headers: noStore});
    const attempt = (stored.ozowAttempts ?? 0) + 1;
    const expireAt = new Date(Date.now() + 90 * 60_000);
    const payment = await createOzowPayment(config, {
      amountCents: Number(stored.subtotalCents) + Number(stored.shippingCents ?? 0),
      merchantReference: existing.reference,
      beneficiaryReference: existing.reference.replace(/[^A-Za-z0-9]/g, '').slice(0, 20),
      expireAt,
      returnUrl: `${siteUrl}/checkout/ozow/${existing.reference}`,
      idempotencyKey: `plentovo-${existing.reference}-${attempt}`,
    });
    await experiencePool().query(
      'UPDATE experience_records SET data=data||$2::jsonb,updated_at=now() WHERE id=$1',
      [existing.id, JSON.stringify({ozowPaymentId: payment.id, ozowRedirectUrl: payment.redirectUrl, ozowExpireAt: expireAt.toISOString(), ozowAttempts: attempt})],
    );
    return NextResponse.json({reference: existing.reference, redirectUrl: payment.redirectUrl}, {status: 201, headers: noStore});
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMIT') return fail('Please wait before placing another order.', 429);
    if (error instanceof Error && error.message === 'REQUEST_CHANGED') return fail('Your checkout details changed. Please try again.', 409);
    console.error('Ozow checkout failed', error instanceof Error ? error.message : error);
    return fail('We couldn’t start the payment. Nothing has been charged. Please retry or choose EFT.', 503);
  }
}

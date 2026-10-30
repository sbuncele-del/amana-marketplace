import {NextRequest, NextResponse} from 'next/server';
import {auth} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {getCatalogueProduct} from '@/lib/catalogue';
import {sameRequestOrigin} from '@/lib/experience/request-origin';
import {insertRecord, event, transaction} from '@/lib/experience/store';
import {payfastConfig} from '@/lib/payfast/config';
import {signedCheckout} from '@/lib/payfast/signature';
import {buildCheckoutOrder, payfastFields} from '@/lib/orders/checkout';
import {supplierPrice} from '@/lib/supplier-price';

const headers = {'Cache-Control': 'no-store'};
const off = () => NextResponse.json({error: 'Online payment is not available yet.', code: 'PAYMENT_NOT_LIVE'}, {status: 503, headers});

// Lets the checkout page know whether to offer the pay button at all.
export async function GET() {
  return NextResponse.json({enabled: payfastConfig(process.env) !== null}, {headers});
}

// Prices the cart on the server, saves an order that awaits payment, and returns signed Payfast form fields.
// Nothing here marks an order paid: only a verified Payfast notification does (see /api/payfast/itn).
export async function POST(request: NextRequest) {
  const cfg = payfastConfig(process.env);
  if (!cfg) return off();
  if (!sameRequestOrigin(request)) return NextResponse.json({error: 'Please use the store.'}, {status: 403, headers});
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return NextResponse.json({error: 'Please sign in to pay.'}, {status: 401, headers});
  const body = await request.json().catch(() => null);
  const method = body?.deliveryMethod === 'COLLECTION' ? 'COLLECTION' : 'DELIVERY';
  const key = typeof body?.checkoutKey === 'string' && /^[A-Za-z0-9-]{16,64}$/.test(body.checkoutKey) ? body.checkoutKey : '';
  if (!key || typeof body?.addressId !== 'string') return NextResponse.json({error: 'Please choose an address and try again.'}, {status: 400, headers});
  try {
    const address = await prisma.address.findFirst({where: {id: body.addressId, userId: session.user.id}});
    const built = await buildCheckoutOrder({
      lines: body.lines, method, userId: session.user.id, email: session.user.email, checkoutKey: key,
      address: address && {fullName: address.fullName, phone: address.phone, street: address.street, city: address.city, state: address.state, zip: address.zip},
    }, {
      product: async slug => (await getCatalogueProduct(slug, true)) ?? null,
      supplierPrice,
    });
    if (!built.ok) return NextResponse.json({error: built.error}, {status: 422, headers});
    const order = await transaction(async client => {
      // A double click or retry with the same cart reuses the order it already created.
      const prior = (await client.query("SELECT reference,data FROM experience_records WHERE kind='ORDER' AND status='CONFIRMED' AND data->>'checkoutKey'=$1 AND data->>'userId'=$2", [key, session.user.id])).rows[0];
      if (prior && prior.data.totalCents === built.totalCents && JSON.stringify(prior.data.items) === JSON.stringify(built.data.items)) return {reference: prior.reference as string};
      const record = await insertRecord(client, {kind: 'ORDER', status: 'CONFIRMED', data: built.data, dueAt: new Date(Date.now() + 24 * 3600000)});
      await event(client, record.id, session.user!.id!, 'CHECKOUT_STARTED', 'Order saved; waiting for Payfast payment', {totalCents: built.totalCents});
      return {reference: record.reference};
    });
    const d = built.data as {customerName: string; phone: string; items: {name: string; quantity: number}[]};
    const fields = signedCheckout(payfastFields({
      reference: order.reference, totalCents: built.totalCents, name: d.customerName, email: session.user.email, phone: d.phone,
      itemNames: d.items.map(i => `${i.quantity} x ${i.name}`),
    }, cfg), cfg.passphrase);
    return NextResponse.json({action: cfg.processUrl, fields, reference: order.reference}, {headers});
  } catch (e) {
    console.error('[checkout] payfast start failed', e);
    return NextResponse.json({error: 'We could not start your payment. Please try again shortly.'}, {status: 503, headers});
  }
}

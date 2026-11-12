import {randomUUID} from 'node:crypto';
import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {operator, assertAccess, canManage, ExperienceError} from '@/lib/experience/access';
import {experiencePool, event} from '@/lib/experience/store';
import {audit, commerceTransaction, ensureCommerce} from '@/lib/commerce/store';
import {commerceFailure, privateHeaders, requireOrigin} from '@/lib/commerce/http';
import {CommerceError} from '@/lib/commerce/access';

const actions = z.discriminatedUnion('action', [
  z.object({action: z.literal('assign'), orderId: z.string().uuid(), lineIndex: z.number().int().min(0).max(99),
    partnerId: z.string().uuid(), unitCostCents: z.number().int().min(0).max(100_000_000)}),
  z.object({action: z.literal('settle'), shipmentId: z.string().uuid(), reference: z.string().trim().min(3).max(120)}),
]);

const pendingIssue = `EXISTS(SELECT 1 FROM experience_records c WHERE c.order_id=r.id AND c.kind='CASE'
  AND c.status<>'RESOLVED' AND c.data->>'category' IN ('DELIVERY','RETURN','PAYMENT'))`;

function failure(error: unknown) {
  if (error instanceof ExperienceError) return NextResponse.json({error: error.message}, {status: error.status, headers: privateHeaders});
  return commerceFailure(error);
}

export async function GET(request: NextRequest) {
  try {
    const actor = await operator();
    await ensureCommerce();
    const id = request.nextUrl.searchParams.get('order');
    if (!id) {
      if (!actor.admin) throw new ExperienceError(403, 'Only administrators can view seller settlements.');
      const page = z.coerce.number().int().min(1).max(10000).catch(1).parse(request.nextUrl.searchParams.get('page') ?? 1);
      const {rows} = await experiencePool().query(
        `SELECT s.id,s.status,s.seller_cost_cents,s.settlement_reference,s.settled_at,p.name AS supplier,r.reference,
           ${pendingIssue} AS on_hold
         FROM commerce_shipments s JOIN commerce_partners p ON p.id=s.partner_id
         JOIN experience_records r ON r.id=s.order_id
         WHERE s.market_code='ZA' AND s.status<>'REJECTED'
         ORDER BY s.created_at DESC,s.id DESC LIMIT 51 OFFSET $1`,
        [(page - 1) * 50],
      );
      return NextResponse.json({rows: rows.slice(0, 50), more: rows.length > 50}, {headers: privateHeaders});
    }
    if (!z.string().uuid().safeParse(id).success) throw new ExperienceError(400, 'Choose an order.');
    const {rows: [order]} = await experiencePool().query(
      "SELECT team_id,status,data FROM experience_records WHERE id=$1 AND kind='ORDER' AND coalesce(data->>'country','ZA')='ZA'", [id],
    );
    if (!order) throw new ExperienceError(404, 'Order not found.');
    assertAccess(actor, order.team_id);
    const {rows: shipments} = await experiencePool().query(
      `SELECT s.id,s.status,s.tracking_number,p.name AS supplier,
        (SELECT jsonb_agg(jsonb_build_object('orderLineIndex',line->'orderLineIndex','name',line->'name','quantity',line->'quantity'))
         FROM jsonb_array_elements(s.lines) line) AS lines
       FROM commerce_shipments s JOIN commerce_partners p ON p.id=s.partner_id
       WHERE s.order_id=$1 AND s.market_code='ZA' AND s.status<>'REJECTED' ORDER BY s.created_at`, [id],
    );
    const assignable = canManage(actor, order.team_id) && isAssignable(order);
    const partners = assignable ? (await experiencePool().query(
      "SELECT p.id,p.name FROM commerce_partners p JOIN commerce_partner_markets m ON m.partner_id=p.id WHERE m.market_code='ZA' AND p.status='APPROVED' AND p.kind='SELLER' ORDER BY p.name",
    )).rows : [];
    return NextResponse.json({shipments, partners, assignable}, {headers: privateHeaders});
  } catch (error) {
    return failure(error);
  }
}

function isAssignable(order: {status: string; data: Record<string, unknown>}) {
  return ['PAID', 'FULFILMENT'].includes(order.status) && order.data.deliveryMethod !== 'COLLECTION' &&
    (order.data.paymentVerified === true || (order.data.paymentMethod === 'EFT' && !!order.data.paymentReference));
}

export async function POST(request: NextRequest) {
  try {
    requireOrigin(request);
    const actor = await operator();
    const parsed = actions.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new CommerceError(400, 'Check the supplier and amount or payment reference.');
    const body = parsed.data;
    const result = await commerceTransaction(async client => {
      if (body.action === 'settle') {
        if (!actor.admin) throw new ExperienceError(403, 'Only administrators can record seller payments.');
        const lookup = await client.query("SELECT order_id FROM commerce_shipments WHERE id=$1 AND market_code='ZA'", [body.shipmentId]);
        if (!lookup.rowCount) throw new ExperienceError(404, 'Shipment not found.');
        await client.query('SELECT id FROM experience_records WHERE id=$1 FOR UPDATE', [lookup.rows[0].order_id]);
        const {rows: [shipment]} = await client.query(
          `SELECT s.status,s.seller_cost_cents,s.settled_at,${pendingIssue} AS on_hold
           FROM commerce_shipments s JOIN experience_records r ON r.id=s.order_id
           WHERE s.id=$1 FOR UPDATE OF s`, [body.shipmentId],
        );
        if (!shipment || shipment.status !== 'DELIVERED' || shipment.seller_cost_cents === null || shipment.on_hold || shipment.settled_at) {
          throw new ExperienceError(409, 'The shipment must be delivered, costed, clear of open issues and unpaid.');
        }
        await client.query('UPDATE commerce_shipments SET settled_at=now(),settlement_reference=$2 WHERE id=$1', [body.shipmentId, body.reference]);
        await audit(client, actor.id, 'SELLER_PAYMENT_RECORDED', body.shipmentId, 'ZA', {reference: body.reference});
        return {success: true};
      }

      const {rows: [order]} = await client.query(
        "SELECT * FROM experience_records WHERE id=$1 AND kind='ORDER' AND coalesce(data->>'country','ZA')='ZA' FOR UPDATE",
        [body.orderId],
      );
      if (!order) throw new ExperienceError(404, 'Order not found.');
      if (!canManage(actor, order.team_id)) throw new ExperienceError(403, 'A team lead must assign this order.');
      if (!isAssignable(order)) throw new ExperienceError(409, 'Verify payment before assigning a delivery order.');
      const item = Array.isArray(order.data.items) ? order.data.items[body.lineIndex] : null;
      if (typeof item?.name !== 'string' || !Number.isSafeInteger(item.quantity) || item.quantity < 1) throw new ExperienceError(400, 'Choose a valid order item.');
      const address = order.data.deliveryAddress;
      if (!address?.street || !address.city || !address.postcode) throw new ExperienceError(409, 'This order needs a complete delivery address before assignment.');
      const {rows: [partner]} = await client.query(
        "SELECT p.name FROM commerce_partners p JOIN commerce_partner_markets m ON m.partner_id=p.id WHERE p.id=$1 AND m.market_code='ZA' AND p.status='APPROVED' AND p.kind='SELLER' FOR SHARE OF p",
        [body.partnerId],
      );
      if (!partner) throw new ExperienceError(400, 'Choose an approved South African seller.');
      const conflict = await client.query(
        `SELECT 1 FROM commerce_shipments s WHERE order_id=$1 AND status<>'REJECTED' AND EXISTS(
           SELECT 1 FROM jsonb_array_elements(s.lines) l WHERE NOT (l ? 'orderLineIndex') OR l->>'orderLineIndex'=$2
         )`, [body.orderId, String(body.lineIndex)],
      );
      if (conflict.rowCount) throw new ExperienceError(409, 'This item already has an active shipment assignment.');
      const shipmentId = randomUUID();
      const lines = [{orderLineIndex: body.lineIndex, name: item.name, option: item.option, sku: item.sku, quantity: item.quantity}];
      await client.query(
        `INSERT INTO commerce_shipments(id,request_key,order_id,partner_id,market_code,lines,delivery_address,seller_cost_cents)
         VALUES($1,$1,$2,$3,'ZA',$4,$5,$6)`,
        [shipmentId, body.orderId, body.partnerId, JSON.stringify(lines),
          JSON.stringify({name: order.data.customerName, street: address.street, city: address.city, state: address.state, postcode: address.postcode, phone: order.data.phone}),
          body.unitCostCents * item.quantity],
      );
      await event(client, body.orderId, actor.id, 'SUPPLIER_ASSIGNED', `${item.name} × ${item.quantity} assigned to ${partner.name}.`);
      await audit(client, actor.id, 'SHIPMENT_ASSIGNED', shipmentId, 'ZA', {orderId: body.orderId, partnerId: body.partnerId});
      return {success: true};
    });
    return NextResponse.json(result, {headers: privateHeaders});
  } catch (error) {
    return failure(error);
  }
}

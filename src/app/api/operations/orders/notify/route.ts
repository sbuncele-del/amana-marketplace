import {NextRequest, NextResponse} from 'next/server';
import {commerceActor, requireMarket} from '@/lib/commerce/access';
import {commerceFailure, privateHeaders, requireOrigin} from '@/lib/commerce/http';
import {notifyPaidOrderLive} from '@/lib/orders/notify-live';

// Staff re-send of the fulfilment alert for one verified-paid South African order.
// It cannot mark anything paid: eligibility is re-checked on the order record.
export async function POST(request: NextRequest) {
  try {
    requireOrigin(request);
    const actor = await commerceActor();
    requireMarket(actor, 'ZA', true);
    const body = await request.json().catch(() => null);
    const orderId = typeof body?.orderId === 'string' ? body.orderId : '';
    if (!orderId || orderId.length > 100) return NextResponse.json({error: 'An order id is required.'}, {status: 400, headers: privateHeaders});
    const result = await notifyPaidOrderLive(orderId, {force: body?.resend === true, actor: actor.id});
    const status = {sent: 200, already_sent: 200, not_found: 404, not_eligible: 409, invalid_order: 422, not_configured: 503, send_failed: 502}[result.status];
    return NextResponse.json(result, {status, headers: privateHeaders});
  } catch (e) {
    return commerceFailure(e);
  }
}

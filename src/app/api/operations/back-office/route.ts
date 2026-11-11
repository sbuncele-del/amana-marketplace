import {savedOrderPhoto} from '@/lib/order-item-image';
import {NextRequest, NextResponse} from 'next/server';
import {z} from 'zod';
import {commerceActor, CommerceError, requireMarket} from '@/lib/commerce/access';
import {operator, ExperienceError, canManage} from '@/lib/experience/access';
import {experiencePool} from '@/lib/experience/store';
import {deskPool} from '@/lib/orders-desk/pool';
import type {QuotePricing} from '@/lib/back-office-quote';
import type {BackOfficeOrder, Market} from '@/lib/back-office';

const query = z.object({
  market: z.enum(['ZA', 'TN']),
  queue: z.enum(['payment', 'dispatch', 'delivery', 'quote', 'all']).default('all'),
  search: z.string().max(100).default(''),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});

const zaSource = `
  SELECT r.id,r.reference,r.status,r.created_at,r.team_id,r.version,u.name AS owner,
    coalesce(r.data->>'customerName','') AS customer,coalesce(r.data->>'city','') AS location,
    r.data->>'deliveryMethod' AS delivery_method, r.data->>'trackingNumber' AS tracking_number, r.data->'items' AS items, (r.data->>'subtotalCents')::numeric AS subtotal,
    (r.data->>'shippingCents')::numeric AS delivery,
    r.data->'quotePricing' AS quote_pricing, r.data->>'deliveryTerms' AS delivery_terms,
    r.data->>'enquiryNote' AS enquiry_note,
    CASE WHEN r.status IN ('ENQUIRY','QUOTED') THEN r.data->>'email' END AS quote_email,
    CASE WHEN r.status IN ('ENQUIRY','QUOTED') THEN r.data->>'phone' END AS quote_phone,
    CASE WHEN r.status='CONFIRMED' AND r.data->>'paymentMethod'='EFT' THEN 'payment'
      WHEN r.status IN ('PAID','FULFILMENT') THEN 'dispatch'
      WHEN r.status='SHIPPED' THEN 'delivery'
      WHEN r.status IN ('ENQUIRY','QUOTED') THEN 'quote' END AS bucket
  FROM experience_records r LEFT JOIN "User" u ON u.id=r.owner_id
  WHERE r.kind='ORDER' AND coalesce(r.data->>'country','ZA')='ZA'
    AND ($4::boolean OR r.team_id=ANY($5::text[]))`;

const tnSource = `
  SELECT o.reference AS id,o.reference,o.status,o.created_at,o.last_call_by AS owner,
    coalesce(o.customer->>'name','') AS customer,
    concat_ws(', ',nullif(o.customer->>'delegation',''),nullif(o.customer->>'governorate','')) AS location,
    to_jsonb(o)->>'shipper_status' AS carrier_status,o.tracking_number,
    o.items,o.subtotal_millimes AS subtotal,o.delivery_fee_millimes AS delivery,
    CASE WHEN o.status IN ('PENDING_CONFIRMATION','NO_ANSWER') THEN 'payment'
      WHEN o.status='CONFIRMED' THEN 'dispatch'
      WHEN o.status='DISPATCHED' THEN 'delivery'
      WHEN o.status='RETURNED' THEN 'quote' END AS bucket
  FROM public.plentovo_tn_orders o WHERE o.market='TN'`;

export async function GET(request: NextRequest) {
  const headers = {'Cache-Control': 'private, no-store'};
  const parsed = query.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({error: 'Check the report filters.'}, {status: 400, headers});
  const {market, queue, search, page} = parsed.data;

  try {
    const op = market === 'ZA' ? await operator() : null;
    if (market === 'TN') {
      requireMarket(await commerceActor(), 'TN');
      if (!process.env.TUNISIA_DATABASE_URL) {
        return NextResponse.json({error: 'Tunisia’s storefront database is not connected to Back Office.'}, {status: 503, headers});
      }
    }
    const db = op ? experiencePool() : await deskPool();
    const source = op ? zaSource : tnSource;
    const {rows: [report]} = await db.query(`
      WITH source AS (${source}), filtered AS (
        SELECT * FROM source WHERE ($1='all' OR bucket=$1)
          AND ($2='' OR strpos(lower(concat_ws(' ',reference,customer,items::text)),lower($2))>0)
      ), paged AS (
        SELECT * FROM filtered ORDER BY created_at DESC,id DESC LIMIT 25 OFFSET $3
      )
      SELECT (SELECT coalesce(jsonb_object_agg(bucket, amount),'{}') FROM
        (SELECT bucket,count(*) AS amount FROM source WHERE bucket IS NOT NULL GROUP BY bucket) grouped) AS counts,
        (SELECT count(*)::int FROM filtered) AS total,
        (SELECT coalesce(jsonb_agg(to_jsonb(paged) ORDER BY created_at DESC,id DESC),'[]') FROM paged) AS orders
    `, [queue, search.trim(), (page-1)*25, ...(op ? [op.admin, op.teamIds] : [])]);

    const orders = report.orders.map((row: {
      id: string; reference: string; status: string; bucket: string | null; customer: string;
      location: string; owner: string | null; created_at: string; subtotal: number; delivery: number | null;
      quote_pricing?: QuotePricing; delivery_terms?: string; enquiry_note?: string; quote_email?: string; quote_phone?: string;
      version?: number; team_id?: string; delivery_method?: string; carrier_status?: string; tracking_number?: string; items: Record<string, unknown>[] | null;
    }): BackOfficeOrder => ({
      id: row.id, reference: row.reference, status: row.status, bucket: row.bucket,
      customer: row.customer, location: row.location, owner: row.owner, createdAt: row.created_at,
      subtotal: Number(row.subtotal), delivery: row.delivery === null ? null : Number(row.delivery),
      items: (row.items ?? []).map(item => ({
        name: String(item.name ?? item.title ?? 'Item'), quantity: Number(item.quantity),
        unit: typeof (item.unitPriceCents ?? item.unitMillimes) === 'number' ? Number(item.unitPriceCents ?? item.unitMillimes) : null,
        photo: savedOrderPhoto(item),
        hasCartId: typeof item.id === 'string' && item.id.includes(':'),
        option: typeof item.option === 'string' ? item.option : undefined,
        sku: typeof item.sku === 'string' ? item.sku : undefined,
      })),
      version: row.version, carrierStatus: row.carrier_status || undefined, trackingNumber: row.tracking_number || undefined,
      quotePricing: row.quote_pricing || undefined, deliveryTerms: row.delivery_terms || undefined,
      enquiryNote: row.enquiry_note || undefined, quoteEmail: row.quote_email || undefined, quotePhone: row.quote_phone || undefined,
      collection: row.delivery_method === 'COLLECTION',
      canManage: !!op && canManage(op, row.team_id ?? null),
      canVerify: !!op && row.bucket === 'payment' && canManage(op, row.team_id ?? null),
    }));
    return NextResponse.json({market: market satisfies Market, counts: report.counts, total: report.total, orders}, {headers});
  } catch (error) {
    if (error instanceof ExperienceError || error instanceof CommerceError) {
      return NextResponse.json({error: error.message}, {status: error.status, headers});
    }
    console.error('Back office report failed', {market, code: (error as {code?: string})?.code});
    return NextResponse.json({error: 'This market could not sync. Try again.'}, {status: 503, headers});
  }
}

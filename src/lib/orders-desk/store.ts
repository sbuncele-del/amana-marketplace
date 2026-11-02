// Storage for the orders desk. It sits on the Tunisia cash-on-delivery table and only adds columns and an event log,
// so the storefront keeps working unchanged. Every status change is one statement that also writes the log row.
import { randomUUID } from "node:crypto";
import { ordersSchema, type Queryable } from "../../../apps/tunisia/lib/orders/store";
import {
  canMove,
  missingForMove,
  SELLER_VISIBLE,
  type DeskStatus,
  type MoveInput,
  type Who,
} from "./domain";

export const deskSchema = `${ordersSchema}
ALTER TABLE public.plentovo_tn_orders
 ADD COLUMN IF NOT EXISTS market text NOT NULL DEFAULT 'TN',
 ADD COLUMN IF NOT EXISTS call_attempts integer NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS last_call_at timestamptz,
 ADD COLUMN IF NOT EXISTS last_call_by text,
 ADD COLUMN IF NOT EXISTS delivery_fee_millimes integer,
 ADD COLUMN IF NOT EXISTS partner_id text,
 ADD COLUMN IF NOT EXISTS tracking_number text,
 ADD COLUMN IF NOT EXISTS updated_at timestamptz;
CREATE INDEX IF NOT EXISTS plentovo_tn_orders_status ON public.plentovo_tn_orders (market, status, created_at DESC);
CREATE INDEX IF NOT EXISTS plentovo_tn_orders_partner ON public.plentovo_tn_orders (partner_id, status);
CREATE TABLE IF NOT EXISTS public.plentovo_tn_order_events (
 id text PRIMARY KEY, reference text NOT NULL, actor_id text NOT NULL, actor_name text NOT NULL, actor_kind text NOT NULL,
 from_status text NOT NULL, to_status text NOT NULL, note text, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS plentovo_tn_order_events_ref ON public.plentovo_tn_order_events (reference, created_at DESC);`;

export type Scope = { who: "staff"; markets: string[] } | { who: "seller"; partnerIds: string[] };

export type DeskOrder = {
  reference: string;
  market: string;
  status: DeskStatus;
  createdAt: string;
  name: string;
  phone: string;
  governorate: string;
  delegation: string;
  address: string;
  customerNotes: string;
  items: { title: string; quantity: number; unitMillimes: number }[];
  subtotalMillimes: number;
  deliveryFeeMillimes: number | null;
  partnerId: string | null;
  trackingNumber: string | null;
  // Staff only: the call history. A seller never gets these fields.
  callAttempts?: number;
  lastCallAt?: string | null;
  lastCallBy?: string | null;
  lastNote?: string | null;
};

const COLS = `o.reference,o.market,o.status,o.created_at,o.customer,o.items,o.subtotal_millimes,o.delivery_fee_millimes,o.partner_id,
 o.tracking_number,o.call_attempts,o.last_call_at,o.last_call_by,
 (SELECT e.note FROM public.plentovo_tn_order_events e WHERE e.reference=o.reference AND coalesce(e.note,'')<>'' ORDER BY e.created_at DESC LIMIT 1) AS last_note`;

function shape(r: any, who: Who): DeskOrder {
  const c = r.customer ?? {};
  const base: DeskOrder = {
    reference: r.reference,
    market: r.market ?? "TN",
    status: r.status,
    createdAt: new Date(r.created_at).toISOString(),
    name: c.name ?? "",
    phone: c.phone ?? "",
    governorate: c.governorate ?? "",
    delegation: c.delegation ?? "",
    address: c.address ?? "",
    customerNotes: c.notes ?? "",
    items: (r.items ?? []).map((i: any) => ({ title: i.title, quantity: i.quantity, unitMillimes: i.unitMillimes })),
    subtotalMillimes: r.subtotal_millimes,
    deliveryFeeMillimes: r.delivery_fee_millimes ?? null,
    partnerId: r.partner_id ?? null,
    trackingNumber: r.tracking_number ?? null,
  };
  if (who === "seller") return base;
  return {
    ...base,
    callAttempts: r.call_attempts ?? 0,
    lastCallAt: r.last_call_at ? new Date(r.last_call_at).toISOString() : null,
    lastCallBy: r.last_call_by ?? null,
    lastNote: r.last_note ?? null,
  };
}

export async function listOrders(db: Queryable, scope: Scope, limit = 500): Promise<DeskOrder[]> {
  const r =
    scope.who === "staff"
      ? await db.query(`SELECT ${COLS} FROM public.plentovo_tn_orders o WHERE o.market = ANY($2::text[]) ORDER BY o.created_at DESC LIMIT $1`, [limit, scope.markets])
      : await db.query(
          `SELECT ${COLS} FROM public.plentovo_tn_orders o WHERE o.partner_id = ANY($1::text[]) AND o.status = ANY($2::text[])
           ORDER BY o.created_at DESC LIMIT $3`,
          [scope.partnerIds, SELLER_VISIBLE, limit],
        );
  return r.rows.map((row) => shape(row, scope.who));
}

export async function orderHistory(db: Queryable, reference: string, markets: string[]) {
  const r = await db.query(
    `SELECT e.actor_name,e.actor_kind,e.from_status,e.to_status,e.note,e.created_at FROM public.plentovo_tn_order_events e
     JOIN public.plentovo_tn_orders o ON o.reference=e.reference WHERE e.reference=$1 AND o.market = ANY($2::text[]) ORDER BY e.created_at DESC LIMIT 50`,
    [reference, markets],
  );
  return r.rows.map((e) => ({
    by: e.actor_name as string,
    kind: e.actor_kind as string,
    from: e.from_status as string,
    to: e.to_status as string,
    note: (e.note as string) || "",
    at: new Date(e.created_at).toISOString(),
  }));
}

export type MoveResult =
  | { ok: true; order: DeskOrder }
  | { ok: false; code: "NOT_FOUND" | "CHANGED" | "NOT_ALLOWED" | "INCOMPLETE"; message: string };

export async function moveOrder(
  db: Queryable,
  args: {
    reference: string;
    expectedFrom: DeskStatus;
    actor: { id: string; name: string; who: Who; partnerIds?: string[]; markets?: string[] };
    move: MoveInput;
  },
): Promise<MoveResult> {
  const { reference, expectedFrom, actor, move } = args;
  const cur = (
    await db.query("SELECT status,partner_id,market FROM public.plentovo_tn_orders WHERE reference=$1", [reference])
  ).rows[0];
  if (!cur) return { ok: false, code: "NOT_FOUND", message: "That order no longer exists." };
  if (actor.who === "seller" && !(actor.partnerIds ?? []).includes(cur.partner_id))
    return { ok: false, code: "NOT_FOUND", message: "That order no longer exists." };
  if (actor.who === "staff" && !(actor.markets ?? []).includes(cur.market))
    return { ok: false, code: "NOT_FOUND", message: "That order no longer exists." };
  if (cur.status !== expectedFrom)
    return { ok: false, code: "CHANGED", message: "Someone else just updated this order. Refresh and check it." };
  if (!canMove(actor.who, expectedFrom, move.to))
    return { ok: false, code: "NOT_ALLOWED", message: "That change isn't available for this order." };
  const gap = missingForMove(move, { partnerId: cur.partner_id });
  if (gap) return { ok: false, code: "INCOMPLETE", message: gap };
  // A seller can only dispatch to themselves and cannot reassign the order.
  const partnerId = actor.who === "seller" ? null : move.partnerId || null;
  const called = actor.who === "staff" && (expectedFrom === "PENDING_CONFIRMATION" || expectedFrom === "NO_ANSWER");
  const note = (move.note ?? "").trim().slice(0, 500);
  const r = await db.query(
    `WITH u AS (
       UPDATE public.plentovo_tn_orders SET status=$3, updated_at=now(),
        call_attempts = call_attempts + $4::int,
        last_call_at = CASE WHEN $4::int=1 THEN now() ELSE last_call_at END,
        last_call_by = CASE WHEN $4::int=1 THEN $5 ELSE last_call_by END,
        delivery_fee_millimes = coalesce($6::int, delivery_fee_millimes),
        partner_id = coalesce($7::text, partner_id),
        tracking_number = coalesce($8::text, tracking_number)
       WHERE reference=$1 AND status=$2 RETURNING reference)
     INSERT INTO public.plentovo_tn_order_events(id,reference,actor_id,actor_name,actor_kind,from_status,to_status,note)
     SELECT $9,reference,$10,$5,$11,$2,$3,$12 FROM u RETURNING reference`,
    [
      reference,
      expectedFrom,
      move.to,
      called ? 1 : 0,
      actor.name,
      move.deliveryFeeMillimes ?? null,
      partnerId,
      (move.trackingNumber ?? "").trim().slice(0, 150) || null,
      randomUUID(),
      actor.id,
      actor.who,
      note || null,
    ],
  );
  if (!r.rows[0]) return { ok: false, code: "CHANGED", message: "Someone else just updated this order. Refresh and check it." };
  const row = (
    await db.query(`SELECT ${COLS} FROM public.plentovo_tn_orders o WHERE o.reference=$1`, [reference])
  ).rows[0];
  return { ok: true, order: shape(row, actor.who) };
}

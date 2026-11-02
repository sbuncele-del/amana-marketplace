import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { commerceActor, CommerceError, type CommerceActor } from "@/lib/commerce/access";
import { permits } from "@/lib/commerce/domain";
import { commerceFailure, requireOrigin, privateHeaders } from "@/lib/commerce/http";
import { experiencePool } from "@/lib/experience/store";
import { deskPool } from "@/lib/orders-desk/pool";
import { listOrders, moveOrder, orderHistory } from "@/lib/orders-desk/store";
import { MARKET_CODES, MARKETS, STATUSES } from "@/lib/orders-desk/domain";

// Staff (admins, or people granted the Tunisia market) run the calls. Approved seller partners see their own confirmed orders.
function role(a: CommerceActor, write: boolean) {
  const markets = MARKET_CODES.filter((m) => permits(a.admin, a.grants, m, write));
  if (markets.length) return { who: "staff" as const, markets };
  if (a.partners.length) return { who: "seller" as const, markets: [] as string[] };
  throw new CommerceError(403, "You don't have access to orders.");
}

const move = z.object({
  reference: z.string().min(3).max(40),
  expectedFrom: z.enum(STATUSES),
  to: z.enum(STATUSES),
  note: z.string().max(500).optional(),
  deliveryFeeMillimes: z.number().int().min(0).max(1_000_000).nullable().optional(),
  partnerId: z.string().max(80).nullable().optional(),
  trackingNumber: z.string().max(150).nullable().optional(),
});

export async function GET(r: NextRequest) {
  try {
    const a = await commerceActor();
    const { who, markets } = role(a, false);
    const db = await deskPool();
    const history = r.nextUrl.searchParams.get("history");
    if (history) {
      if (who !== "staff") throw new CommerceError(403, "Call history is for staff only.");
      return NextResponse.json({ history: await orderHistory(db, history, markets) }, { headers: privateHeaders });
    }
    const orders = await listOrders(db, who === "staff" ? { who, markets } : { who, partnerIds: a.partners });
    // The seller list for the "who delivers this" choice, and the names shown on a seller's own screen.
    const partners = (
      await experiencePool().query(
        who === "staff"
          ? "SELECT id,name FROM commerce_partners WHERE status='APPROVED' ORDER BY name"
          : "SELECT id,name FROM commerce_partners WHERE id=ANY($1::text[]) ORDER BY name",
        who === "staff" ? [] : [a.partners],
      )
    ).rows;
    return NextResponse.json({ who, orders, partners, me: a.name, markets: markets.map((code) => ({ code, name: MARKETS[code as keyof typeof MARKETS].name })) }, { headers: privateHeaders });
  } catch (e) {
    return commerceFailure(e);
  }
}

export async function POST(r: NextRequest) {
  try {
    requireOrigin(r);
    const a = await commerceActor();
    const { who, markets } = role(a, true);
    const parsed = move.safeParse(await r.json().catch(() => null));
    if (!parsed.success) throw new CommerceError(400, "Check the details and try again.");
    const { reference, expectedFrom, ...rest } = parsed.data;
    const result = await moveOrder(await deskPool(), {
      reference,
      expectedFrom,
      actor: { id: a.id, name: a.name, who, partnerIds: a.partners, markets },
      move: rest,
    });
    if (!result.ok)
      throw new CommerceError(result.code === "NOT_FOUND" ? 404 : result.code === "INCOMPLETE" ? 400 : 409, result.message);
    return NextResponse.json({ order: result.order }, { headers: privateHeaders });
  } catch (e) {
    return commerceFailure(e);
  }
}

import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { commerceActor, CommerceError, requireAdmin, requireMarket } from "@/lib/commerce/access";
import { commerceFailure, privateHeaders, requireOrigin } from "@/lib/commerce/http";
import { audit, commerceTransaction } from "@/lib/commerce/store";
import { experiencePool } from "@/lib/experience/store";

const marketCode = z.string().regex(/^[A-Z]{2}$/);
const profile = z.object({
  method: z.string().trim().min(1).max(150),
  coverage: z.string().trim().max(500),
  leadTime: z.string().trim().max(150),
  terms: z.string().trim().max(2000),
  rates: z.array(z.object({
    service: z.string().trim().min(1).max(150),
    conditions: z.string().trim().max(300),
    amount: z.string().regex(/^\d{1,8}(\.\d{1,3})?$/),
  })).max(30),
});
const action = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    market: marketCode,
    name: z.string().trim().min(1).max(150),
    kind: z.enum(["SELLER", "FULFILMENT"]),
    website: z.string().trim().max(500).refine(value => !value || /^https?:\/\//i.test(value) && z.string().url().safeParse(value).success),
  }),
  z.object({
    action: z.literal("save"),
    market: marketCode,
    id: z.string().uuid(),
    version: z.number().int().nonnegative(),
    profile,
  }),
]);

export async function GET(request: NextRequest) {
  try {
    const actor = await commerceActor();
    const market = marketCode.safeParse(request.nextUrl.searchParams.get("market"));
    if (!market.success) throw new CommerceError(400, "Choose a market.");
    requireMarket(actor, market.data);
    const { rows } = await experiencePool().query(
      `SELECT p.id,p.name,p.kind,p.status,p.version AS review_version,p.verification_note,p.website,d.profile,coalesce(d.version,0) AS version
       FROM commerce_partner_markets pm JOIN commerce_partners p ON p.id=pm.partner_id
       LEFT JOIN commerce_partner_delivery d USING(partner_id,market_code)
       WHERE pm.market_code=$1 ORDER BY p.name,p.id`,
      [market.data],
    );
    return NextResponse.json(rows, { headers: privateHeaders });
  } catch (error) {
    return commerceFailure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireOrigin(request);
    const actor = await commerceActor();
    requireAdmin(actor);
    const parsed = action.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new CommerceError(400, "Check the partner and delivery fields.");
    const body = parsed.data;
    const result = await commerceTransaction(async client => {
      if (body.action === "create") {
        const market = await client.query("SELECT code FROM commerce_markets WHERE code=$1", [body.market]);
        if (!market.rowCount) throw new CommerceError(400, "Choose a configured market.");
        const id = randomUUID();
        await client.query(
          "INSERT INTO commerce_partners(id,name,website,kind) VALUES($1,$2,$3,$4)",
          [id, body.name, body.website, body.kind],
        );
        await client.query("INSERT INTO commerce_partner_markets VALUES($1,$2)", [id, body.market]);
        await audit(client, actor.id, "PARTNER_CREATED", id, body.market, { kind: body.kind });
        return { id };
      }
      const membership = await client.query(
        "SELECT 1 FROM commerce_partner_markets WHERE partner_id=$1 AND market_code=$2 FOR UPDATE",
        [body.id, body.market],
      );
      if (!membership.rowCount) throw new CommerceError(404, "Partner not found in this market.");
      const current = await client.query(
        "SELECT version FROM commerce_partner_delivery WHERE partner_id=$1 AND market_code=$2",
        [body.id, body.market],
      );
      if ((current.rows[0]?.version ?? 0) !== body.version) {
        throw new CommerceError(409, "Someone updated this rate card. Reload the page before editing again.");
      }
      const { rows } = await client.query(
        `INSERT INTO commerce_partner_delivery(partner_id,market_code,profile) VALUES($1,$2,$3)
         ON CONFLICT(partner_id,market_code) DO UPDATE SET profile=excluded.profile,version=commerce_partner_delivery.version+1
         RETURNING version`,
        [body.id, body.market, JSON.stringify(body.profile)],
      );
      await audit(client, actor.id, "PARTNER_DELIVERY_UPDATED", body.id, body.market, { version: rows[0].version });
      return rows[0];
    });
    return NextResponse.json(result, { headers: privateHeaders });
  } catch (error) {
    return commerceFailure(error);
  }
}

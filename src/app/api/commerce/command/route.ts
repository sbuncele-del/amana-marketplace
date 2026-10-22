import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  commerceActor,
  CommerceError,
  requireAdmin,
  requireMarket,
} from "@/lib/commerce/access";
import { commerceTransaction, audit } from "@/lib/commerce/store";
import { experiencePool } from "@/lib/experience/store";
import {
  marketSchema,
  offerSchema,
  activationProblems,
  marketCode,
  allocationProblems,
} from "@/lib/commerce/domain";
import {
  commerceFailure,
  requireOrigin,
  privateHeaders,
} from "@/lib/commerce/http";
const command = z.discriminatedUnion("action", [
  z.object({ action: z.literal("market"), market: marketSchema }),
  z.object({
    action: z.literal("staff"),
    email: z.string().email(),
    market: marketCode.nullable(),
    role: z.enum(["MANAGER", "CATALOGUE", "MARKETING", "FULFILMENT"]),
    active: z.boolean(),
  }),
  z.object({
    action: z.literal("partner-review"),
    id: z.string(),
    version: z.number().int().positive(),
    status: z.enum(["APPROVED", "REJECTED", "SUSPENDED"]),
    note: z.string().trim().min(10).max(2000),
  }),
  z.object({
    action: z.literal("partner-member"),
    id: z.string(),
    email: z.string().email(),
    active: z.boolean(),
  }),
  z.object({ action: z.literal("offer"), offer: offerSchema }),
  z.object({
    action: z.literal("offer-review"),
    id: z.string(),
    version: z.number().int().positive(),
    approved: z.boolean(),
  }),
  z.object({
    action: z.literal("sync-failure"),
    partnerId: z.string(),
    market: marketCode,
    errorCode: z.string().regex(/^[A-Z_]{3,50}$/),
  }),
  z.object({
    action: z.literal("shipment"),
    requestKey: z.string().uuid(),
    orderId: z.string(),
    partnerId: z.string(),
    market: marketCode,
    lines: z
      .array(
        z.object({
          offerId: z.string(),
          quantity: z.number().int().positive().max(1000),
        }),
      )
      .min(1)
      .max(50),
    address: z.object({
      name: z.string().min(2).max(150),
      street: z.string().min(3).max(300),
      city: z.string().min(2).max(150),
      postcode: z.string().min(2).max(30),
      phone: z.string().min(5).max(40),
    }),
  }),
]);
export async function GET(request: NextRequest) {
  try {
    const a = await commerceActor();
    const market =
      request.nextUrl.searchParams.get("market") ||
      (a.admin || a.grants.some((g) => !g.market_code)
        ? "ZA"
        : a.grants[0]?.market_code) ||
      "ZA";
    requireMarket(a, market);
    const page = Math.max(
      1,
      Math.min(
        100000,
        Math.floor(Number(request.nextUrl.searchParams.get("page"))) || 1,
      ),
    );
    const all = a.admin || a.grants.some((g) => g.market_code === null);
    const markets = (
      await experiencePool().query(
        `SELECT * FROM commerce_markets ${all ? "" : "WHERE code=ANY($1::text[])"} ORDER BY code`,
        all ? [] : [a.grants.map((g) => g.market_code)],
      )
    ).rows;
    const [partners, offers, shipments, staff, runs] = await Promise.all([
      experiencePool().query(
        "SELECT p.id,p.name,p.website,p.kind,p.status,p.version,p.verification_note,array_agg(pm.market_code) AS markets FROM commerce_partners p JOIN commerce_partner_markets pm ON pm.partner_id=p.id WHERE p.id IN (SELECT partner_id FROM commerce_partner_markets WHERE market_code=$1) GROUP BY p.id ORDER BY p.created_at DESC LIMIT 200",
        [market],
      ),
      experiencePool().query(
        "SELECT o.*,p.title FROM commerce_offers o JOIN commerce_products p ON p.id=o.product_id WHERE market_code=$1 ORDER BY o.updated_at DESC LIMIT 50 OFFSET $2",
        [market, (page - 1) * 50],
      ),
      experiencePool().query(
        "SELECT id,order_id,partner_id,status,tracking_number,version FROM commerce_shipments WHERE market_code=$1 ORDER BY created_at DESC LIMIT 100",
        [market],
      ),
      a.admin
        ? experiencePool().query(
            'SELECT s.user_id,u.email,s.market_code,s.role,s.active FROM commerce_staff s JOIN "User" u ON u.id=s.user_id ORDER BY u.email LIMIT 200',
          )
        : Promise.resolve({ rows: [] }),
      experiencePool().query(
        "SELECT id,partner_id,status,processed,error_code,created_at FROM commerce_sync_runs WHERE market_code=$1 ORDER BY created_at DESC LIMIT 20",
        [market],
      ),
    ]);
    return NextResponse.json(
      {
        actor: { name: a.name, admin: a.admin, grants: a.grants },
        markets,
        partners: partners.rows,
        offers: offers.rows,
        shipments: shipments.rows,
        staff: staff.rows,
        syncRuns: runs.rows,
        orderingEnabled: false,
        page,
      },
      { headers: privateHeaders },
    );
  } catch (e) {
    return commerceFailure(e);
  }
}
export async function POST(request: NextRequest) {
  try {
    requireOrigin(request);
    const a = await commerceActor();
    const parsed = command.safeParse(await request.json());
    if (!parsed.success)
      throw new CommerceError(400, "Check the submitted fields.");
    const b = parsed.data;
    const result = await commerceTransaction(async (c) => {
      if (b.action === "market") {
        requireAdmin(a);
        const m = b.market;
        const old = (
          await c.query(
            "SELECT * FROM commerce_markets WHERE code=$1 FOR UPDATE",
            [m.code],
          )
        ).rows[0];
        if (old && old.version !== m.version)
          throw new CommerceError(
            409,
            "Market changed. Refresh before saving.",
          );
        if (!m.languages.includes(m.locale))
          throw new CommerceError(
            400,
            "Default language must be a supported language.",
          );
        if (m.status === "ACTIVE" && old?.status !== "ACTIVE") {
          const coverage = (
            await c.query(
              "SELECT count(*)::int AS n FROM commerce_partner_markets pm JOIN commerce_partners p ON p.id=pm.partner_id WHERE pm.market_code=$1 AND p.status='APPROVED'",
              [m.code],
            )
          ).rows[0].n;
          const problems = activationProblems(m, coverage);
          if (problems.length)
            throw new CommerceError(
              400,
              "Before activation confirm: " + problems.join(", "),
            );
        }
        await c.query(
          "INSERT INTO commerce_markets(code,name,currency,locale,languages,status,readiness) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(code) DO UPDATE SET name=$2,currency=$3,locale=$4,languages=$5,status=$6,readiness=$7,version=commerce_markets.version+1,updated_at=now()",
          [
            m.code,
            m.name,
            m.currency,
            m.locale,
            JSON.stringify(m.languages),
            m.status,
            JSON.stringify(m.readiness),
          ],
        );
        await audit(c, a.id, "MARKET_SAVED", m.code, m.code, {
          status: m.status,
        });
        return { code: m.code };
      }
      if (b.action === "staff") {
        requireAdmin(a);
        const u = (
          await c.query(
            'SELECT id FROM "User" WHERE lower(email)=lower($1) AND "isActive"=true',
            [b.email],
          )
        ).rows[0];
        if (!u)
          throw new CommerceError(
            404,
            "An active Plentovo account is required.",
          );
        await c.query(
          "INSERT INTO commerce_staff(user_id,scope,market_code,role,active) VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id,scope) DO UPDATE SET role=$4,active=$5",
          [u.id, b.market || "*", b.market, b.role, b.active],
        );
        await audit(c, a.id, "STAFF_ACCESS_CHANGED", u.id, b.market, {
          role: b.role,
          active: b.active,
        });
        return { success: true };
      }
      if (b.action === "partner-review" || b.action === "partner-member") {
        requireAdmin(a);
        const p = (
          await c.query(
            "SELECT * FROM commerce_partners WHERE id=$1 FOR UPDATE",
            [b.id],
          )
        ).rows[0];
        if (!p) throw new CommerceError(404, "Partner not found.");
        if (b.action === "partner-review") {
          if (p.version !== b.version)
            throw new CommerceError(409, "Partner changed. Refresh first.");
          await c.query(
            "UPDATE commerce_partners SET status=$2,verification_note=$3,version=version+1,updated_at=now() WHERE id=$1",
            [b.id, b.status, b.note],
          );
          if (b.status === "APPROVED" && p.applicant_id)
            await c.query(
              "INSERT INTO commerce_partner_members(partner_id,user_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
              [p.id, p.applicant_id],
            );
          await audit(c, a.id, "PARTNER_REVIEWED", p.id, null, {
            status: b.status,
            note: b.note,
          });
        } else {
          const u = (
            await c.query(
              'SELECT id FROM "User" WHERE lower(email)=lower($1) AND "isActive"=true',
              [b.email],
            )
          ).rows[0];
          if (!u)
            throw new CommerceError(
              404,
              "An active Plentovo account is required.",
            );
          await c.query(
            "INSERT INTO commerce_partner_members(partner_id,user_id,active) VALUES($1,$2,$3) ON CONFLICT(partner_id,user_id) DO UPDATE SET active=$3",
            [b.id, u.id, b.active],
          );
          await audit(c, a.id, "PARTNER_ACCESS_CHANGED", p.id, null, {
            userId: u.id,
            active: b.active,
          });
        }
        return { success: true };
      }
      if (b.action === "offer") {
        const o = b.offer;
        requireMarket(a, o.market, true);
        if (
          !a.admin &&
          !a.grants.some(
            (g) =>
              (!g.market_code || g.market_code === o.market) &&
              ["MANAGER", "CATALOGUE"].includes(g.role),
          )
        )
          throw new CommerceError(403, "Catalogue access required.");
        const market = (
          await c.query("SELECT currency FROM commerce_markets WHERE code=$1", [
            o.market,
          ])
        ).rows[0];
        if (!market || market.currency !== o.currency)
          throw new CommerceError(400, "Use the configured market currency.");
        const coverage = await c.query(
          "SELECT 1 FROM commerce_partner_markets WHERE partner_id=$1 AND market_code=$2",
          [o.partnerId, o.market],
        );
        if (!coverage.rowCount)
          throw new CommerceError(400, "Partner does not cover this market.");
        if (
          new Date(o.observedAt) > new Date() ||
          new Date(o.expiresAt) <= new Date() ||
          new Date(o.expiresAt).getTime() - new Date(o.observedAt).getTime() >
            86400000
        )
          throw new CommerceError(
            400,
            "Inventory observation must be current.",
          );
        await c.query(
          "INSERT INTO commerce_products(id,title,google_category_id) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING",
          [o.productId, o.title, o.categoryId],
        );
        await c.query(
          "INSERT INTO commerce_variants(id,product_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
          [o.variantId, o.productId],
        );
        const id = randomUUID();
        const row = (
          await c.query(
            `INSERT INTO commerce_offers(id,partner_id,market_code,product_id,variant_id,supplier_sku,currency,cost_minor,price_minor,quantity,stock_status,observed_at,expires_at,delivery_min_days,delivery_max_days) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT(partner_id,market_code,supplier_sku) DO UPDATE SET product_id=$4,variant_id=$5,currency=$7,cost_minor=$8,price_minor=$9,quantity=$10,stock_status=$11,observed_at=$12,expires_at=$13,delivery_min_days=$14,delivery_max_days=$15,approved=false,version=commerce_offers.version+1,updated_at=now() RETURNING id`,
            [
              id,
              o.partnerId,
              o.market,
              o.productId,
              o.variantId,
              o.supplierSku,
              o.currency,
              o.costMinor,
              o.priceMinor,
              o.quantity,
              o.stockStatus,
              o.observedAt,
              o.expiresAt,
              o.deliveryMinDays,
              o.deliveryMaxDays,
            ],
          )
        ).rows[0];
        await audit(c, a.id, "OFFER_SUBMITTED", row.id, o.market);
        return row;
      }
      if (b.action === "offer-review") {
        const o = (
          await c.query(
            "SELECT * FROM commerce_offers WHERE id=$1 FOR UPDATE",
            [b.id],
          )
        ).rows[0];
        if (!o) throw new CommerceError(404, "Offer not found.");
        requireMarket(a, o.market_code, true);
        if (
          !a.admin &&
          !a.grants.some(
            (g) =>
              (!g.market_code || g.market_code === o.market_code) &&
              g.role === "MANAGER",
          )
        )
          throw new CommerceError(
            403,
            "A commerce manager must approve publication.",
          );
        if (o.version !== b.version)
          throw new CommerceError(409, "Offer changed. Refresh first.");
        if (b.approved) {
          const partner = await c.query(
            "SELECT 1 FROM commerce_partners WHERE id=$1 AND status='APPROVED'",
            [o.partner_id],
          );
          if (!partner.rowCount || new Date(o.expires_at) <= new Date())
            throw new CommerceError(
              400,
              "Approval requires a verified partner and current stock observation.",
            );
        }
        await c.query(
          "UPDATE commerce_offers SET approved=$2,version=version+1,updated_at=now() WHERE id=$1",
          [b.id, b.approved],
        );
        await audit(c, a.id, "OFFER_REVIEWED", b.id, o.market_code, {
          approved: b.approved,
        });
        return { success: true };
      }
      if (b.action === "sync-failure") {
        requireMarket(a, b.market, true);
        if (
          !a.admin &&
          !a.grants.some(
            (g) =>
              (!g.market_code || g.market_code === b.market) &&
              ["MANAGER", "CATALOGUE"].includes(g.role),
          )
        )
          throw new CommerceError(403, "Catalogue access required.");
        await c.query(
          "INSERT INTO commerce_sync_runs(id,partner_id,market_code,status,error_code) VALUES($1,$2,$3,'FAILED',$4)",
          [randomUUID(), b.partnerId, b.market, b.errorCode],
        );
        await c.query(
          "UPDATE commerce_offers SET stock_status='UNKNOWN',approved=false,version=version+1,updated_at=now() WHERE partner_id=$1 AND market_code=$2",
          [b.partnerId, b.market],
        );
        await audit(c, a.id, "SUPPLIER_SYNC_FAILED", b.partnerId, b.market, {
          errorCode: b.errorCode,
        });
        return { success: true };
      }
      if (b.action === "shipment") {
        requireMarket(a, b.market, true);
        if (
          !a.admin &&
          !a.grants.some(
            (g) =>
              (!g.market_code || g.market_code === b.market) &&
              ["MANAGER", "FULFILMENT"].includes(g.role),
          )
        )
          throw new CommerceError(403, "Fulfilment access required.");
        const order = (
          await c.query(
            "SELECT * FROM experience_records WHERE id=$1 AND kind='ORDER' FOR UPDATE",
            [b.orderId],
          )
        ).rows[0];
        if (
          !order ||
          !["PAID", "FULFILMENT"].includes(order.status) ||
          order.data.country !== b.market ||
          order.data.paymentVerified !== true
        )
          throw new CommerceError(
            400,
            "A confirmed paid order in this market is required.",
          );
        const partner = await c.query(
          "SELECT 1 FROM commerce_partners p JOIN commerce_partner_markets pm ON pm.partner_id=p.id WHERE p.id=$1 AND pm.market_code=$2 AND p.status='APPROVED'",
          [b.partnerId, b.market],
        );
        if (!partner.rowCount)
          throw new CommerceError(
            400,
            "Approved fulfilment coverage required.",
          );
        const prior = (
          await c.query(
            "SELECT id,order_id,partner_id,market_code,lines FROM commerce_shipments WHERE request_key=$1",
            [b.requestKey],
          )
        ).rows[0];
        if (prior) {
          if (
            prior.order_id !== b.orderId ||
            prior.partner_id !== b.partnerId ||
            prior.market_code !== b.market ||
            JSON.stringify(prior.lines) !== JSON.stringify(b.lines)
          )
            throw new CommerceError(409, "Allocation key already used.");
          return { id: prior.id };
        }
        const offers = (
          await c.query(
            "SELECT id FROM commerce_offers WHERE id=ANY($1::text[]) AND partner_id=$2 AND market_code=$3",
            [b.lines.map((l) => l.offerId), b.partnerId, b.market],
          )
        ).rows;
        if (offers.length !== new Set(b.lines.map((l) => l.offerId)).size)
          throw new CommerceError(
            400,
            "Every item must belong to the assigned partner and market.",
          );
        const existing = (
          await c.query(
            "SELECT lines FROM commerce_shipments WHERE order_id=$1 AND status!='REJECTED'",
            [b.orderId],
          )
        ).rows.flatMap((r) => r.lines);
        const problems = allocationProblems(
          order.data.commerceLines,
          b.lines,
          existing,
        );
        if (problems.length) throw new CommerceError(400, problems.join(" "));
        // A paid, immutable offer snapshot is required; legacy orders cannot be dispatched through this route.

        const id = randomUUID();
        await c.query(
          "INSERT INTO commerce_shipments(id,order_id,partner_id,market_code,lines,delivery_address,request_key) VALUES($1,$2,$3,$4,$5,$6,$7)",
          [
            id,
            b.orderId,
            b.partnerId,
            b.market,
            JSON.stringify(b.lines),
            JSON.stringify(b.address),
            b.requestKey,
          ],
        );
        await audit(c, a.id, "SHIPMENT_ASSIGNED", id, b.market, {
          orderId: b.orderId,
          partnerId: b.partnerId,
        });
        return { id };
      }
    });
    return NextResponse.json(result, { headers: privateHeaders });
  } catch (e) {
    return commerceFailure(e);
  }
}

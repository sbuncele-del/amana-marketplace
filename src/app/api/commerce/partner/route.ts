import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  commerceActor,
  CommerceError,
  requirePartner,
} from "@/lib/commerce/access";
import { commerceTransaction, audit } from "@/lib/commerce/store";
import { experiencePool } from "@/lib/experience/store";
import { partnerSchema, canMoveShipment } from "@/lib/commerce/domain";
import {
  commerceFailure,
  requireOrigin,
  privateHeaders,
} from "@/lib/commerce/http";
const action = z.discriminatedUnion("action", [
  z.object({ action: z.literal("apply"), application: partnerSchema }),
  z.object({
    action: z.literal("inventory"),
    offerId: z.string(),
    version: z.number().int().positive(),
    quantity: z.number().int().nonnegative().nullable(),
    status: z.enum(["AVAILABLE", "UNAVAILABLE", "UNKNOWN"]),
    observedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
  }),
  z.object({
    action: z.literal("shipment"),
    id: z.string(),
    version: z.number().int().positive(),
    status: z.enum(["ACCEPTED", "REJECTED", "DISPATCHED", "DELIVERED"]),
    trackingNumber: z.string().trim().max(150).optional(),
  }),
]);
export async function GET() {
  try {
    const a = await commerceActor();
    const [applications, offers, shipments, markets] = await Promise.all([
      experiencePool().query(
        "SELECT id,name,website,kind,status,note,version FROM commerce_partners WHERE applicant_id=$1 OR id=ANY($2::text[]) ORDER BY created_at DESC",
        [a.id, a.partners],
      ),
      experiencePool().query(
        "SELECT o.id,o.market_code,o.supplier_sku,o.quantity,o.stock_status,o.observed_at,o.expires_at,o.version,p.title FROM commerce_offers o JOIN commerce_products p ON p.id=o.product_id WHERE partner_id=ANY($1::text[]) ORDER BY o.updated_at DESC LIMIT 100",
        [a.partners],
      ),
      // Only assigned partners see recipient information; no other orders or internal prices are exposed.
      experiencePool().query(
        "SELECT id,order_id,partner_id,market_code,status,lines,delivery_address,tracking_number,version FROM commerce_shipments WHERE partner_id=ANY($1::text[]) ORDER BY created_at DESC LIMIT 100",
        [a.partners],
      ),
      experiencePool().query(
        "SELECT code,name FROM commerce_markets ORDER BY name",
      ),
    ]);
    return NextResponse.json(
      {
        applications: applications.rows,
        offers: offers.rows,
        shipments: shipments.rows,
        markets: markets.rows,
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
    const parsed = action.safeParse(await request.json());
    if (!parsed.success)
      throw new CommerceError(400, "Check the submitted fields.");
    const b = parsed.data;
    const result = await commerceTransaction(async (c) => {
      if (b.action === "apply") {
        const p = b.application;
        const prior = await c.query(
          "SELECT id FROM commerce_partners WHERE applicant_id=$1",
          [a.id],
        );
        if (prior.rowCount)
          throw new CommerceError(
            409,
            "Your application is already on file. Contact Plentovo to amend it.",
          );
        const markets = await c.query(
          "SELECT code FROM commerce_markets WHERE code=ANY($1::text[])",
          [p.markets],
        );
        if (markets.rowCount !== new Set(p.markets).size)
          throw new CommerceError(400, "Choose configured markets.");
        const id = randomUUID();
        await c.query(
          "INSERT INTO commerce_partners(id,name,website,kind,applicant_id,note) VALUES($1,$2,$3,$4,$5,$6)",
          [id, p.name, p.website, p.kind, a.id, p.note],
        );
        for (const market of new Set(p.markets))
          await c.query(
            "INSERT INTO commerce_partner_markets(partner_id,market_code) VALUES($1,$2)",
            [id, market],
          );
        await audit(c, a.id, "PARTNER_APPLIED", id, null, {
          kind: p.kind,
          markets: p.markets,
        });
        return { id };
      }
      if (b.action === "inventory") {
        const o = (
          await c.query(
            "SELECT * FROM commerce_offers WHERE id=$1 FOR UPDATE",
            [b.offerId],
          )
        ).rows[0];
        if (!o) throw new CommerceError(404, "Offer not found.");
        requirePartner(a, o.partner_id);
        if (o.version !== b.version)
          throw new CommerceError(409, "Inventory changed. Refresh first.");
        if (
          new Date(b.observedAt) < new Date(o.observed_at) ||
          new Date(b.observedAt) > new Date() ||
          new Date(b.expiresAt) <= new Date() ||
          new Date(b.expiresAt) <= new Date(b.observedAt) ||
          new Date(b.expiresAt).getTime() - new Date(b.observedAt).getTime() >
            86400000 ||
          (b.status === "AVAILABLE" && b.quantity === 0)
        )
          throw new CommerceError(
            400,
            "Check inventory freshness and available quantity.",
          );
        await c.query(
          "UPDATE commerce_offers SET quantity=$2,stock_status=$3,observed_at=$4,expires_at=$5,version=version+1,updated_at=now() WHERE id=$1",
          [b.offerId, b.quantity, b.status, b.observedAt, b.expiresAt],
        );
        await audit(c, a.id, "INVENTORY_UPDATED", o.id, o.market_code, {
          status: b.status,
          quantity: b.quantity,
        });
        return { success: true };
      }
      const shipment = (
        await c.query(
          "SELECT * FROM commerce_shipments WHERE id=$1 FOR UPDATE",
          [b.id],
        )
      ).rows[0];
      if (!shipment) throw new CommerceError(404, "Shipment not found.");
      requirePartner(a, shipment.partner_id);
      if (shipment.version !== b.version)
        throw new CommerceError(409, "Shipment changed. Refresh first.");
      if (!canMoveShipment(shipment.status, b.status))
        throw new CommerceError(400, "Follow the shipment steps in order.");
      if (b.status === "DISPATCHED" && !b.trackingNumber)
        throw new CommerceError(
          400,
          "Tracking number is required before dispatch.",
        );
      await c.query(
        "UPDATE commerce_shipments SET status=$2,tracking_number=coalesce($3,tracking_number),version=version+1,updated_at=now() WHERE id=$1",
        [b.id, b.status, b.trackingNumber || null],
      );
      await audit(c, a.id, "SHIPMENT_UPDATED", b.id, shipment.market_code, {
        from: shipment.status,
        to: b.status,
      });
      return { success: true };
    });
    return NextResponse.json(result, { headers: privateHeaders });
  } catch (e) {
    return commerceFailure(e);
  }
}

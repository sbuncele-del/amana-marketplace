import { NextRequest, NextResponse } from "next/server";
import { ensureCommerce } from "@/lib/commerce/store";
import { experiencePool } from "@/lib/experience/store";
// Read contract for a later storefront integration. Supplier identity and costs stay private.
export async function GET(request: NextRequest) {
  try {
    const market = request.nextUrl.searchParams.get("market");
    const product = request.nextUrl.searchParams.get("product");
    if (
      !market ||
      !/^[A-Z]{2}$/.test(market) ||
      !product ||
      product.length > 150
    )
      return NextResponse.json(
        { error: "Market and product are required." },
        { status: 400 },
      );
    await ensureCommerce();
    const result = await experiencePool().query(
      `SELECT DISTINCT ON (o.variant_id) o.id AS "offerId",o.product_id AS "productId",o.variant_id AS "variantId",p.title,o.currency,o.price_minor AS "priceMinor",o.delivery_min_days AS "deliveryMinDays",o.delivery_max_days AS "deliveryMaxDays",o.expires_at AS "expiresAt" FROM commerce_offers o JOIN commerce_markets m ON m.code=o.market_code JOIN commerce_partners partner ON partner.id=o.partner_id JOIN commerce_products p ON p.id=o.product_id WHERE o.market_code=$1 AND o.product_id=$2 AND m.status='ACTIVE' AND m.currency=o.currency AND partner.status='APPROVED' AND o.approved=true AND o.stock_status='AVAILABLE' AND (o.quantity IS NULL OR o.quantity>0) AND o.observed_at<=now() AND o.expires_at>now() ORDER BY o.variant_id,o.price_minor,o.id LIMIT 100`,
      [market, product],
    );
    return NextResponse.json(
      { offers: result.rows, orderingEnabled: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Availability is temporarily unavailable." },
      { status: 503 },
    );
  }
}

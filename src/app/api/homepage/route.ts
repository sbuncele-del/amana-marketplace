import { NextResponse } from "next/server";
import { getProducts, toProductCardData } from "@/lib/shopify";

// GET /api/homepage — products for homepage sections (from Shopify)
export async function GET() {
  try {
    const [newest, bestSellers] = await Promise.all([
      getProducts({ first: 12, sortKey: "CREATED_AT", reverse: true }),
      getProducts({ first: 12, sortKey: "BEST_SELLING", reverse: false }),
    ]);

    const newArrivalsData = newest.products.map(toProductCardData);
    const bestSellersData = bestSellers.products.map(toProductCardData);

    return NextResponse.json({
      featured: bestSellersData.slice(0, 6),
      bestSellers: bestSellersData,
      newArrivals: newArrivalsData,
      deals: newArrivalsData,
      categories: [],
    }, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("Homepage API error:", error);
    return NextResponse.json({ featured: [], bestSellers: [], newArrivals: [], deals: [], categories: [] }, { status: 200 });
  }
}


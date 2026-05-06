import { NextRequest, NextResponse } from "next/server";
import { getProducts, toProductCardData } from "@/lib/shopify";

// GET /api/shopify/products — list products from Shopify
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const collection = searchParams.get("collection") || "";
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const after = searchParams.get("after") || undefined;

    // Map Amana sort values to Shopify sort keys
    const sortMap: Record<string, { sortKey: "RELEVANCE" | "PRICE" | "TITLE" | "CREATED_AT" | "BEST_SELLING"; reverse: boolean }> = {
      newest: { sortKey: "CREATED_AT", reverse: true },
      oldest: { sortKey: "CREATED_AT", reverse: false },
      "price-low": { sortKey: "PRICE", reverse: false },
      "price-high": { sortKey: "PRICE", reverse: true },
      popular: { sortKey: "BEST_SELLING", reverse: false },
      relevance: { sortKey: "RELEVANCE", reverse: false },
    };

    const { sortKey, reverse } = sortMap[sort] ?? sortMap.newest;

    // Build Shopify search query
    let query = "";
    if (search) query += `title:${search}* OR tag:${search}* OR product_type:${search}* `;
    // If no collection but minPrice/maxPrice given
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    if (minPrice) query += `variants.price:>=${minPrice} `;
    if (maxPrice) query += `variants.price:<=${maxPrice} `;

    const result = await getProducts({
      first: limit,
      query: query.trim() || undefined,
      collection: collection || undefined,
      sortKey,
      reverse,
      after,
    });

    const products = result.products.map(toProductCardData);

    return NextResponse.json({
      products,
      total: products.length,
      page,
      hasNextPage: result.hasNextPage,
      endCursor: result.endCursor,
    });
  } catch (error) {
    console.error("[Shopify Products API]", error);
    return NextResponse.json(
      { error: "Failed to fetch products from Shopify", products: [], total: 0 },
      { status: 500 }
    );
  }
}

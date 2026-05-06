import { NextRequest, NextResponse } from "next/server";
import { getProduct } from "@/lib/shopify";

// GET /api/shopify/products/[handle] — single product by Shopify handle
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    const product = await getProduct(handle);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("[Shopify Product API]", error);
    return NextResponse.json(
      { error: "Failed to fetch product from Shopify" },
      { status: 500 }
    );
  }
}

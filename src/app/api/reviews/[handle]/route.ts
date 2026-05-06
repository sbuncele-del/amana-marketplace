import { NextRequest, NextResponse } from "next/server";

const FERA_API = "https://api.fera.ai/v3/public";
const SHOPIFY_STOREFRONT = "https://kj9fmh-dd.myshopify.com/api/2026-04/graphql.json";
const STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN ?? "0b73f8efeaea149098ca8b37457df320";

// Resolve Shopify product GID from handle (Fera uses GID as external_id)
async function getProductGid(handle: string): Promise<string | null> {
  try {
    const res = await fetch(SHOPIFY_STOREFRONT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({
        query: `{ productByHandle(handle: "${handle}") { id } }`,
      }),
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return data?.data?.productByHandle?.id ?? null;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const publicKey = process.env.FERA_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ reviews: [], rating: null, count: 0 });
  }

  const { handle } = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = parseInt(searchParams.get("per_page") ?? "10");

  // Get Shopify product GID so Fera can match it
  const productGid = await getProductGid(handle);

  // Try GID first, fall back to handle as external_id
  const externalId = productGid ?? handle;

  try {
    // Fetch reviews
    const reviewsUrl = new URL(`${FERA_API}/reviews`);
    reviewsUrl.searchParams.set("public_key", publicKey);
    reviewsUrl.searchParams.set("product.external_id", externalId);
    reviewsUrl.searchParams.set("state", "approved");
    reviewsUrl.searchParams.set("page_size", String(pageSize));
    reviewsUrl.searchParams.set("page", String(page));
    reviewsUrl.searchParams.set("sort_by", "created_at:desc");

    const [reviewsRes, ratingRes] = await Promise.all([
      fetch(reviewsUrl.toString(), { next: { revalidate: 300 } }),
      fetch(
        `${FERA_API}/products/${encodeURIComponent(externalId)}/rating?public_key=${publicKey}`,
        { next: { revalidate: 300 } }
      ),
    ]);

    const reviewsData = reviewsRes.ok ? await reviewsRes.json() : { data: [] };
    const ratingData = ratingRes.ok ? await ratingRes.json() : null;

    // Normalise Fera review shape to what the frontend expects
    const reviews = (reviewsData.data ?? []).map((r: {
      id: string;
      rating: number;
      heading?: string;
      body?: string;
      customer?: { display_name?: string; email?: string };
      created_at: string;
      media?: { src?: string; thumbnail_url?: string }[];
    }) => ({
      id: r.id,
      rating: r.rating,
      title: r.heading ?? "",
      body: r.body ?? "",
      reviewer: {
        name: r.customer?.display_name ?? "Verified Buyer",
        email: r.customer?.email ?? "",
      },
      created_at: r.created_at,
      pictures: (r.media ?? []).map((m) => ({
        urls: { small: m.thumbnail_url ?? m.src ?? "", huge: m.src ?? "" },
      })),
    }));

    return NextResponse.json({
      reviews,
      rating: ratingData?.average ?? null,
      count: ratingData?.count ?? reviews.length,
    });
  } catch {
    return NextResponse.json({ reviews: [], rating: null, count: 0 });
  }
}

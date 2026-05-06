import { NextRequest, NextResponse } from "next/server";

const JUDGEME_API = "https://judge.me/api/v1";
const SHOP_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? "kj9fmh-dd.myshopify.com";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const apiToken = process.env.JUDGEME_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json({ reviews: [], rating: null, count: 0 });
  }

  const { handle } = await params;
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") ?? "1";
  const perPage = searchParams.get("per_page") ?? "10";

  const url = new URL(`${JUDGEME_API}/reviews`);
  url.searchParams.set("api_token", apiToken);
  url.searchParams.set("shop_domain", SHOP_DOMAIN);
  url.searchParams.set("product_handle", handle);
  url.searchParams.set("per_page", perPage);
  url.searchParams.set("page", page);

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 300 }, // cache 5 min
    });

    if (!res.ok) {
      return NextResponse.json({ reviews: [], rating: null, count: 0 });
    }

    const data = await res.json();

    // Fetch aggregate rating separately
    const ratingUrl = new URL(`${JUDGEME_API}/products/-1`);
    ratingUrl.searchParams.set("api_token", apiToken);
    ratingUrl.searchParams.set("shop_domain", SHOP_DOMAIN);
    ratingUrl.searchParams.set("handle", handle);

    let rating = null;
    let count = 0;
    try {
      const ratingRes = await fetch(ratingUrl.toString(), { next: { revalidate: 300 } });
      if (ratingRes.ok) {
        const ratingData = await ratingRes.json();
        rating = ratingData.product?.rating ?? null;
        count = ratingData.product?.reviews_count ?? 0;
      }
    } catch {
      // rating stays null
    }

    return NextResponse.json({
      reviews: data.reviews ?? [],
      rating,
      count,
    });
  } catch {
    return NextResponse.json({ reviews: [], rating: null, count: 0 });
  }
}

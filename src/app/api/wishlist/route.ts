import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ensureAccess } from "@/lib/access/store";
import { transaction, experiencePool } from "@/lib/experience/store";
import { getCatalogueProduct, getCatalogueSnapshot } from "@/lib/catalogue";
export async function GET(r: NextRequest) {
  const s = await auth();
  if (!s?.user?.id)
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  try {
    await ensureAccess();
    const rows = (
      await experiencePool().query(
        "SELECT slug FROM customer_wishlist WHERE user_id=$1 ORDER BY created_at DESC",
        [s.user.id],
      )
    ).rows;
    const slugs = rows.map((p) => String(p.slug));
    if (!r.nextUrl.searchParams.has("page"))
      return NextResponse.json(
        { slugs },
        { headers: { "Cache-Control": "no-store" } },
      );
    const page = Math.max(
      1,
      Math.min(10, Math.floor(Number(r.nextUrl.searchParams.get("page"))) || 1),
    );
    const selected = slugs.slice((page - 1) * 20, page * 20);
    const products = await Promise.all(
      selected.map((slug) => getCatalogueProduct(slug, false, false, "ZA")),
    );
    return NextResponse.json(
      { slugs: selected, products, total: slugs.length, page },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Saved items are temporarily unavailable." },
      { status: 503 },
    );
  }
}
export async function POST(r: NextRequest) {
  if (r.headers.get("origin") !== r.nextUrl.origin)
    return NextResponse.json(
      { error: "Submit from Plentovo." },
      { status: 403 },
    );
  const s = await auth();
  if (!s?.user?.id)
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  try {
    if (process.env.VERCEL_ENV === "preview")
      return NextResponse.json(
        { error: "Saving is disabled on this preview." },
        { status: 503 },
      );
    const text = await r.text();
    if (text.length > 500)
      return NextResponse.json({ error: "Invalid item." }, { status: 400 });
    const b = JSON.parse(text);
    if (
      typeof b.slug !== "string" ||
      !/^[a-z0-9-]{1,180}$/.test(b.slug) ||
      typeof b.saved !== "boolean"
    )
      return NextResponse.json({ error: "Invalid item." }, { status: 400 });
    await ensureAccess();
    if (
      b.saved &&
      !(await getCatalogueSnapshot()).some((p) => p.slug === b.slug)
    )
      return NextResponse.json(
        { error: "Product is no longer listed." },
        { status: 404 },
      );
    const ok = await transaction(async (c) => {
      await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        "wishlist:" + s.user.id,
      ]);
      if (!b.saved) {
        await c.query(
          "DELETE FROM customer_wishlist WHERE user_id=$1 AND slug=$2",
          [s.user.id, b.slug],
        );
        return true;
      }
      const count = (
        await c.query(
          "SELECT count(*)::int n FROM customer_wishlist WHERE user_id=$1",
          [s.user.id],
        )
      ).rows[0].n;
      if (count >= 200) return false;
      await c.query(
        "INSERT INTO customer_wishlist(user_id,slug) VALUES($1,$2) ON CONFLICT DO NOTHING",
        [s.user.id, b.slug],
      );
      return true;
    });
    return NextResponse.json(
      ok
        ? { saved: b.saved }
        : { error: "Your wishlist holds up to 200 products." },
      { status: ok ? 200 : 400, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not update your wishlist." },
      { status: 503 },
    );
  }
}

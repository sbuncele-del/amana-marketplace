import { NextRequest, NextResponse } from "next/server";
import { ensureCommerce } from "@/lib/commerce/store";
import { experiencePool } from "@/lib/experience/store";

export async function GET(request: NextRequest) {
  try {
    await ensureCommerce();
    const markets = (
      await experiencePool().query(
        "SELECT code,name,currency,locale,languages FROM commerce_markets WHERE status='ACTIVE' ORDER BY code",
      )
    ).rows;
    const saved = request.cookies.get("plentovo-market")?.value;
    const hint = request.headers.get("x-vercel-ip-country");
    const detected = hint && /^[A-Z]{2}$/.test(hint) ? hint : null;
    const countryNames = new Intl.DisplayNames(['en'], {type:'region'});
    const detectedName = detected ? countryNames.of(detected) || detected : null;
    const savedActive = markets.some(m => m.code === saved);
    const detectedActive = markets.some(m => m.code === detected);
    return NextResponse.json(
      {
        markets,
        selectedMarket: saved ? (savedActive ? saved : null) : (detectedActive ? detected : null),
        confirmed: Boolean(saved && savedActive),
        detectedCountry: detected ? {code: detected, name: detectedName, available: detectedActive} : null,
        orderingEnabled: false,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Market service unavailable." },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { requireOrigin, commerceFailure } =
    await import("@/lib/commerce/http");
  try {
    requireOrigin(request);
    const body = await request.json();
    if (typeof body.code !== "string" || !/^[A-Z]{2}$/.test(body.code))
      return NextResponse.json(
        { error: "Choose an active market." },
        { status: 400 },
      );
    await ensureCommerce();
    const match = await experiencePool().query(
      "SELECT code FROM commerce_markets WHERE code=$1 AND status='ACTIVE'",
      [body.code],
    );
    if (!match.rowCount)
      return NextResponse.json(
        { error: "This market is not open yet." },
        { status: 400 },
      );
    const response = NextResponse.json(
      { market: body.code },
      { headers: { "Cache-Control": "private, no-store" } },
    );
    response.cookies.set("plentovo-market", body.code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      ...(body.remember === false ? {} : {maxAge: 31536000}),
    });
    return response;
  } catch (e) {
    return commerceFailure(e);
  }
}

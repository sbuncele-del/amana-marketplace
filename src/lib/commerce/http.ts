import { NextRequest, NextResponse } from "next/server";
import { CommerceError } from "./access";
export function commerceFailure(e: unknown) {
  if (e instanceof CommerceError)
    return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(
    "Commerce request failed",
    e instanceof Error ? e.name : "Unknown error",
  );
  return NextResponse.json(
    { error: "Commerce service is temporarily unavailable." },
    { status: 503 },
  );
}
export function requireOrigin(r: NextRequest) {
  const origin = r.headers.get("origin");
  if (!origin || origin !== r.nextUrl.origin)
    throw new CommerceError(403, "Submit this change from Plentovo.");
}
export const privateHeaders = { "Cache-Control": "no-store" };

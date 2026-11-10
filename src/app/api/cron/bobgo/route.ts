import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { processBobGoEvents } from "@/lib/delivery/bobgo-webhook-store";
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await processBobGoEvents(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Processing temporarily unavailable" }, { status: 503 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestCode } from "@/lib/access/store";
import { normalizeEmail } from "@/lib/access/domain";
const schema = z
  .object({
    email: z.string().trim().email().max(254),
    marketingConsent: z.boolean().default(false),
  })
  .strict();
export async function POST(r: NextRequest) {
  if (r.headers.get("origin") !== r.nextUrl.origin)
    return NextResponse.json(
      { error: "Submit from Plentovo." },
      { status: 403 },
    );
  try {
    const raw = await r.text();
    if (raw.length > 2000)
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    const input = schema.safeParse(JSON.parse(raw));
    if (!input.success)
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    if (process.env.VERCEL_ENV === "preview")
      return NextResponse.json(
        {
          error:
            "Email sign-in is disabled on this preview. Your live account is unchanged.",
        },
        { status: 503 },
      );
    const challenge = await requestCode(
      normalizeEmail(input.data.email),
      r.headers.get("x-vercel-forwarded-for") ||
        r.headers.get("x-forwarded-for") ||
        "unknown",
      input.data.marketingConsent,
    );
    return NextResponse.json(
      { challenge },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const rate = e instanceof Error && e.message === "RATE_LIMIT";
    return NextResponse.json(
      {
        error: rate
          ? "Please wait a minute before requesting another code. Hourly limits also apply."
          : "We could not send a code right now. Use your password or try again shortly.",
      },
      { status: rate ? 429 : 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

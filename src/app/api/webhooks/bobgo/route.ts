import { after, NextRequest, NextResponse } from "next/server";
import { bobGoEventId, bobGoTopics, verifyBobGoSignature } from "@/lib/delivery/bobgo-webhook";
import { processBobGoEvents, receiveBobGoEvent } from "@/lib/delivery/bobgo-webhook-store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  return NextResponse.json({ service: "Plentovo Bob Go webhooks", configured: !!process.env.BOBGO_WEBHOOK_SECRET }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const secret = process.env.BOBGO_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: "Missing body" }, { status: 400 });
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.byteLength;
    if (size > 1_048_576) {
      await reader.cancel();
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    chunks.push(chunk.value);
  }
  const body = Buffer.concat(chunks);
  if (!verifyBobGoSignature(body, request.headers.get("bobgo-webhook-signature") ?? "", secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const topic = request.headers.get("x-bobgroup-topic") ?? "";
  if (!(bobGoTopics as readonly string[]).includes(topic)) return NextResponse.json({ received: true, ignored: true });
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body.toString("utf8"));
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid payload");
  } catch {
    return NextResponse.json({ error: "Invalid JSON object" }, { status: 400 });
  }
  try {
    const inserted = await receiveBobGoEvent(bobGoEventId(topic, body), topic, payload);
    after(async () => {
      try { await processBobGoEvents(); }
      catch { console.error("Bob Go processing deferred to scheduler"); }
    });
    return NextResponse.json({ received: true, duplicate: !inserted });
  } catch {
    return NextResponse.json({ error: "Webhook storage temporarily unavailable" }, { status: 503 });
  }
}

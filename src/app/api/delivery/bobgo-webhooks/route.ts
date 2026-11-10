import { NextRequest, NextResponse } from "next/server";
import { commerceActor, requireAdmin } from "@/lib/commerce/access";
import { commerceFailure, requireOrigin, privateHeaders } from "@/lib/commerce/http";
import { commerceTransaction } from "@/lib/commerce/store";
import { experiencePool } from "@/lib/experience/store";
import { bobGoTopics } from "@/lib/delivery/bobgo-webhook";
import { ensureBobGoWebhooks } from "@/lib/delivery/bobgo-webhook-store";

const deliveryURL = "https://plentovo.com/api/webhooks/bobgo";
const legacyURL = "https://www.plentovo.com/api/webhooks/bobgo";
const key = () => process.env.BOBGO_API_KEY || process.env.BOB_GO_SALES_CHANNEL_API_KEY;
type Subscription = { id: number; topic: string; delivery_url: string; status: string };
async function subscriptions(method = "GET", body?: unknown): Promise<Subscription[]> {
  const token = key();
  if (!token) throw new Error("Bob Go API key missing");
  const response = await fetch("https://api.bobgo.co.za/v2/webhooks", {
    method, cache: "no-store", signal: AbortSignal.timeout(10_000),
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`Bob Go subscriptions request failed (${response.status})`);
  const data = await response.json();
  const rows = Array.isArray(data) ? data : data.webhook_subscriptions;
  if (!Array.isArray(rows)) throw new Error("Unexpected Bob Go subscriptions response");
  return rows;
}

export async function GET() {
  try {
    requireAdmin(await commerceActor());
    await ensureBobGoWebhooks();
    const events = await experiencePool().query(
      "SELECT id,topic,tracking_reference,received_at,processed_at,outcome,attempts FROM bobgo_webhook_events ORDER BY received_at DESC LIMIT 50",
    );
    let active: Subscription[] = [];
    let providerError: string | null = null;
    try { active = await subscriptions(); }
    catch (error) { providerError = error instanceof Error ? error.message : "Bob Go unavailable"; }
    return NextResponse.json({ deliveryURL, topics: bobGoTopics, secretConfigured: !!process.env.BOBGO_WEBHOOK_SECRET,
      apiKeyConfigured: !!key(), subscriptions: active.filter(row => row.delivery_url === deliveryURL), providerError, events: events.rows }, { headers: privateHeaders });
  } catch (error) { return commerceFailure(error); }
}

export async function POST(request: NextRequest) {
  try {
    requireOrigin(request);
    requireAdmin(await commerceActor());
    if (!process.env.BOBGO_WEBHOOK_SECRET) return NextResponse.json({ error: "Add BOBGO_WEBHOOK_SECRET in Vercel and redeploy first." }, { status: 409 });
    const result = await commerceTransaction(async client => {
    await client.query("SELECT pg_advisory_xact_lock(792046330)");
    const existing = await subscriptions();
    const changes = bobGoTopics.flatMap(topic => {
      const matches = existing.filter(row => row.topic === topic && [deliveryURL, legacyURL].includes(row.delivery_url));
      if (matches.some(row => row.status === "active" && row.delivery_url === deliveryURL)) return [];
      const row = matches.find(row => row.delivery_url === deliveryURL) ?? matches[0];
      return [{ ...(row ? { id: row.id } : {}), topic, delivery_url: deliveryURL, status: "active" }];
    });
    return changes.length ? await subscriptions("POST", { webhook_subscriptions: changes }) : existing;
    });
    return NextResponse.json({ subscriptions: result.filter(row => row.delivery_url === deliveryURL) }, { headers: privateHeaders });
  } catch (error) { return commerceFailure(error); }
}

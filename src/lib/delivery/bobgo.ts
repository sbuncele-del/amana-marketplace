// Live courier quotes from Bob Go's SANDBOX. Quote-only: this file never books a shipment or creates an order.
// A collection address is part of every request, so sellers need no location registered in Bob Go.
export type BobGoAddress = {
  type: "business" | "residential";
  company?: string;
  street_address: string;
  local_area: string;
  city: string;
  zone: string;
  country: "ZA";
  code: string;
};
export type BobGoParcel = { lengthCm: number; widthCm: number; heightCm: number; weightKg: number; description: string };
export type BobGoQuote = { courier: string; service: string; priceCents: number; priceExclVatCents: number; chargedWeightKg: number };

const base = "https://api.sandbox.bobgo.co.za/v2";
// The key is named BOBGO_SANDOX_API_KEY in Vercel (typo kept); the correct spelling is accepted too.
const key = () => process.env.BOBGO_SANDOX_API_KEY || process.env.BOBGO_SANDBOX_API_KEY || "";

export function bobGoSandboxConfigured() {
  return key().length > 0;
}

export async function bobGoSandboxQuotes(args: { collection: BobGoAddress; delivery: BobGoAddress; parcels: BobGoParcel[]; declaredValue?: number }) {
  if (!bobGoSandboxConfigured()) throw new Error("Bob Go sandbox key is not set");
  const response = await fetch(`${base}/rates`, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
    headers: { "content-type": "application/json", Authorization: `Bearer ${key()}` },
    body: JSON.stringify({
      collection_address: args.collection,
      delivery_address: args.delivery,
      parcels: args.parcels.map((p) => ({
        submitted_length_cm: p.lengthCm,
        submitted_width_cm: p.widthCm,
        submitted_height_cm: p.heightCm,
        submitted_weight_kg: p.weightKg,
        description: p.description,
      })),
      declared_value: args.declaredValue,
      timeout: 25000,
    }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Bob Go sandbox ${response.status}: ${text.slice(0, 300)}`);
  const data = JSON.parse(text) as {
    provider_rate_requests?: {
      provider_name: string;
      status: string;
      failed_reason?: string;
      responses?: { service_level_code: string; service_level?: { name?: string }; rate_amount: number; rate_amount_excl_vat: number; charged_weight_kg: number; status: string }[];
    }[];
  };
  const quotes: BobGoQuote[] = [];
  const skipped: { courier: string; status: string; reason: string }[] = [];
  for (const p of data.provider_rate_requests ?? []) {
    const ok = (p.responses ?? []).filter((r) => r.status === "success");
    if (!ok.length) skipped.push({ courier: p.provider_name, status: p.status, reason: p.failed_reason || "" });
    for (const r of ok)
      quotes.push({
        courier: p.provider_name,
        service: r.service_level?.name || r.service_level_code,
        priceCents: Math.round(r.rate_amount * 100),
        priceExclVatCents: Math.round(r.rate_amount_excl_vat * 100),
        chargedWeightKg: r.charged_weight_kg,
      });
  }
  quotes.sort((a, b) => a.priceCents - b.priceCents);
  return { quotes, skipped };
}

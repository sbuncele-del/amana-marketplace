import { NextResponse } from "next/server";
import { commerceActor } from "@/lib/commerce/access";
import { commerceFailure, privateHeaders } from "@/lib/commerce/http";
import { bobGoSandboxConfigured, bobGoSandboxQuotes, type BobGoAddress } from "@/lib/delivery/bobgo";

// Administrator-only check that Bob Go's sandbox answers with quotes. Quotes only; nothing is booked or created.
// Optional query: weightKg, toCode, toCity, toZone, toArea, fromCode, fromCity, fromZone, fromArea.
export async function GET(request: Request) {
  try {
    const actor = await commerceActor();
    if (!actor.admin) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
    if (!bobGoSandboxConfigured()) return NextResponse.json({ error: "Bob Go sandbox key is not set in this environment" }, { status: 503, headers: privateHeaders });
    const q = new URL(request.url).searchParams;
    const addr = (p: "from" | "to", d: Omit<BobGoAddress, "type" | "country" | "street_address">, type: BobGoAddress["type"]): BobGoAddress => ({
      type,
      street_address: p === "from" ? "24 Rothesay Avenue" : "5 Long Street",
      local_area: q.get(`${p}Area`) || d.local_area,
      city: q.get(`${p}City`) || d.city,
      zone: q.get(`${p}Zone`) || d.zone,
      code: q.get(`${p}Code`) || d.code,
      country: "ZA",
    });
    const weightKg = Math.min(70, Math.max(0.1, Number(q.get("weightKg")) || 2));
    const result = await bobGoSandboxQuotes({
      collection: addr("from", { local_area: "Craighall Park", city: "Johannesburg", zone: "Gauteng", code: "2196" }, "business"),
      delivery: addr("to", { local_area: "Cape Town City Centre", city: "Cape Town", zone: "Western Cape", code: "8001" }, "residential"),
      parcels: [{ lengthCm: 30, widthCm: 20, heightCm: 10, weightKg, description: "Sandbox test parcel" }],
      declaredValue: 1500,
    });
    return NextResponse.json({ sandbox: true, ...result }, { headers: privateHeaders });
  } catch (e) {
    return commerceFailure(e);
  }
}

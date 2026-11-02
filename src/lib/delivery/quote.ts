// Delivery fee rule, in cents (ZAR, VAT included).
//
// Parcels Perfect Dealz ships from its own warehouse: the customer pays Perfect Dealz's published rate (delivery-rates.ts).
// Parcels we ship ourselves through Bob Go (sellers we onboard): the customer pays the full Bob Go price for the weight and
// zone. The cost of delivery is passed to the customer, so there is no cap and no shortfall for us to absorb.
import rates from "@/data/delivery/bobgo-rates.json";
import { deliveryBands } from "@/lib/delivery-rates";

export type Zone = "local" | "main" | "regional";
export type FulfilledBy = "PERFECT_DEALZ" | "PLENTOVO";
export type Quote = {
  feeCents: number;
  // Who set the customer's fee: Perfect Dealz's published table, or Bob Go's price.
  setBy: "perfect-dealz" | "bob-go";
  courier: string | null;
  service: string | null;
  // What we pay Bob Go. null when Bob Go is not used.
  costCents: number | null;
  // Fee minus cost. Zero while the customer pays the full Bob Go price.
  marginCents: number | null;
};

type Table = { services: [string, string][]; rows: [number, (number | null)[]][] };
const zones = rates.zones as unknown as Record<Zone, Table>;

export const rateCard = { name: rates.rateCard, exportedOn: rates.exportedOn };
// Rate cards go out of date; callers can warn staff instead of silently trusting old prices.
export function rateCardAgeDays(now = new Date()) {
  return Math.floor((now.getTime() - new Date(`${rates.exportedOn}T00:00:00Z`).getTime()) / 86_400_000);
}

export function perfectDealzFeeCents(grams: number) {
  const band = deliveryBands.find((b) => grams < b.underGrams);
  return band ? band.fee * 100 : null;
}

// Bob Go prices by the next listed weight up: 9.2 kg is priced as the 10 kg row.
export function cheapestBobGo(grams: number, zone: Zone) {
  const kg = grams / 1000;
  const row = zones[zone]?.rows.find(([w]) => kg <= w);
  if (!row) return null;
  let best: { cents: number; courier: string; service: string } | null = null;
  for (let i = 0; i < row[1].length; i++) {
    const cents = row[1][i];
    if (cents == null) continue;
    if (best === null || cents < best.cents) best = { cents, courier: zones[zone].services[i][0], service: zones[zone].services[i][1] };
  }
  return best;
}

export function quoteDelivery(args: { grams: number; zone: Zone | null; fulfilledBy: FulfilledBy }): Quote | null {
  const { grams, zone, fulfilledBy } = args;
  if (!Number.isFinite(grams) || grams <= 0) return null;
  const pd = perfectDealzFeeCents(grams);
  if (pd == null) return null;
  if (fulfilledBy === "PERFECT_DEALZ")
    return { feeCents: pd, setBy: "perfect-dealz", courier: null, service: null, costCents: null, marginCents: null };
  // A parcel we ship ourselves needs a zone and a Bob Go price; without them it needs a manual quote.
  if (!zone) return null;
  const bob = cheapestBobGo(grams, zone);
  if (!bob) return null;
  return { feeCents: bob.cents, setBy: "bob-go", courier: bob.courier, service: bob.service, costCents: bob.cents, marginCents: 0 };
}

// For the cart, before an address is known: the lowest Bob Go price across zones, never above Perfect Dealz's rate.
export function cartEstimateCents(grams: number) {
  const pd = perfectDealzFeeCents(grams);
  const prices = (["local", "main", "regional"] as Zone[]).map((z) => cheapestBobGo(grams, z)?.cents).filter((n): n is number => n != null);
  if (pd == null) return null;
  return prices.length ? Math.min(pd, ...prices) : pd;
}

// Delivery fee rule, in cents (ZAR, VAT included).
//
// Every parcel is compared in the background and the customer always gets the cheaper delivery:
// - Parcels from Perfect Dealz's warehouse: Perfect Dealz's published rate against Bob Go's price for collecting from that
//   same warehouse. Whichever is lower is the fee, so nobody pays more on a Perfect Dealz product than Bob Go would charge.
// - Parcels from sellers we onboard: no Perfect Dealz option exists, so the customer pays the full price of the cheapest
//   Bob Go service from the seller's pickup address.
// Either way the customer's fee equals what we pay, so there is no margin and no shortfall.
import rates from "@/data/delivery/bobgo-rates.json";
import { deliveryBands } from "@/lib/delivery-rates";

export type Zone = "local" | "main" | "regional";
export type FulfilledBy = "PERFECT_DEALZ" | "PLENTOVO";
export type Quote = {
  feeCents: number;
  // Who delivers, which is also whose price the customer pays: the cheaper of the two.
  setBy: "perfect-dealz" | "bob-go";
  // false when a Perfect Dealz parcel could only be priced from their table because no zone was known. Checkout must not
  // show a fee for such a parcel until it has been compared.
  compared: boolean;
  courier: string | null;
  service: string | null;
  // What we pay whoever delivers.
  costCents: number;
  // Fee minus cost. Zero: the customer pays exactly what delivery costs us.
  marginCents: number;
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
  if (fulfilledBy === "PERFECT_DEALZ") {
    const bob = zone ? cheapestBobGo(grams, zone) : null;
    if (!bob || bob.cents >= pd)
      return { feeCents: pd, setBy: "perfect-dealz", compared: !!bob, courier: null, service: null, costCents: pd, marginCents: 0 };
    return { feeCents: bob.cents, setBy: "bob-go", compared: true, courier: bob.courier, service: bob.service, costCents: bob.cents, marginCents: 0 };
  }
  // A parcel we ship ourselves needs a zone and a Bob Go price; without them it needs a manual quote.
  if (!zone) return null;
  const bob = cheapestBobGo(grams, zone);
  if (!bob) return null;
  return { feeCents: bob.cents, setBy: "bob-go", compared: true, courier: bob.courier, service: bob.service, costCents: bob.cents, marginCents: 0 };
}

// For the cart, before an address is known: the lowest Bob Go price across zones, never above Perfect Dealz's rate.
export function cartEstimateCents(grams: number) {
  const pd = perfectDealzFeeCents(grams);
  const prices = (["local", "main", "regional"] as Zone[]).map((z) => cheapestBobGo(grams, z)?.cents).filter((n): n is number => n != null);
  if (pd == null) return null;
  return prices.length ? Math.min(pd, ...prices) : pd;
}

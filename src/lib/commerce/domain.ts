import { z } from "zod";
export const marketCode = z.string().regex(/^[A-Z]{2}$/);
export const marketSchema = z
  .object({
    code: marketCode,
    name: z.string().trim().min(2).max(100),
    currency: z.string().regex(/^[A-Z]{3}$/),
    locale: z.string().min(2).max(35),
    languages: z.array(z.string().min(2).max(35)).min(1).max(20),
    status: z.enum(["PREPARATION", "ACTIVE", "SUSPENDED"]),
    readiness: z.object({
      payments: z.boolean(),
      fulfilment: z.boolean(),
      returns: z.boolean(),
      localisation: z.boolean(),
    }),
    version: z.number().int().positive(),
  })
  .strict();
export type Market = z.infer<typeof marketSchema>;
export type Grant = { role: string; market_code: string | null };
export function permits(
  admin: boolean,
  grants: Grant[],
  market: string,
  write = false,
) {
  return (
    admin ||
    grants.some(
      (g) =>
        (!g.market_code || g.market_code === market) &&
        (!write || ["MANAGER", "CATALOGUE", "FULFILMENT"].includes(g.role)),
    )
  );
}
export function activationProblems(
  m: Pick<Market, "readiness" | "languages" | "locale">,
  approvedPartners: number,
) {
  return [
    ...Object.entries(m.readiness)
      .filter(([, v]) => !v)
      .map(([k]) => k),
    ...(!m.languages.includes(m.locale) ? ["default language"] : []),
    ...(approvedPartners < 1 ? ["approved fulfilment coverage"] : []),
  ];
}
export function resolveMarket(
  active: string[],
  saved?: string | null,
  detected?: string | null,
) {
  const preferred = [saved, detected, "ZA"].find(
    (c) => c && active.includes(c),
  );
  return preferred ?? active[0] ?? null;
}
export function offerAvailable(
  status: string,
  observedAt: Date | null,
  expiresAt: Date | null,
  now = new Date(),
) {
  return (
    status === "AVAILABLE" &&
    !!observedAt &&
    !!expiresAt &&
    observedAt <= now &&
    expiresAt > now
  );
}
export const partnerSchema = z
  .object({
    name: z.string().trim().min(2).max(150),
    website: z.string().url().max(500),
    markets: z.array(marketCode).min(1).max(60),
    kind: z.enum(["FULFILMENT", "SELLER"]),
    note: z.string().trim().max(2000).default(""),
  })
  .strict();
export const offerSchema = z
  .object({
    partnerId: z.string().min(1).max(100),
    market: marketCode,
    productId: z.string().min(1).max(150),
    variantId: z.string().min(1).max(150),
    title: z.string().trim().min(2).max(500),
    categoryId: z.string().regex(/^\d+$/).nullable(),
    currency: z.string().regex(/^[A-Z]{3}$/),
    costMinor: z.number().int().nonnegative().max(1e12),
    priceMinor: z.number().int().positive().max(1e12),
    supplierSku: z.string().min(1).max(200),
    stockStatus: z.enum(["AVAILABLE", "UNAVAILABLE", "UNKNOWN"]),
    quantity: z.number().int().nonnegative().nullable(),
    observedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    deliveryMinDays: z.number().int().min(0).max(365),
    deliveryMaxDays: z.number().int().min(0).max(365),
  })
  .strict()
  .refine(
    (o) =>
      o.deliveryMaxDays >= o.deliveryMinDays &&
      new Date(o.expiresAt) > new Date(o.observedAt) &&
      !(o.stockStatus === "AVAILABLE" && o.quantity === 0),
    { message: "Check stock, delivery range and freshness window." },
  );
export function canMoveShipment(from: string, to: string) {
  return (
    (
      {
        ASSIGNED: ["ACCEPTED", "REJECTED"],
        ACCEPTED: ["DISPATCHED"],
        DISPATCHED: ["DELIVERED"],
      } as Record<string, string[]>
    )[from]?.includes(to) ?? false
  );
}

export type AllocationLine = { offerId: string; quantity: number };
export function allocationProblems(
  snapshot: unknown,
  requested: AllocationLine[],
  existing: AllocationLine[],
) {
  const valid = z
    .array(
      z.object({ offerId: z.string(), quantity: z.number().int().positive() }),
    )
    .min(1)
    .safeParse(snapshot);
  if (!valid.success) return ["Order has no verified commerce item snapshot."];
  const paid = new Map<string, number>();
  for (const l of valid.data)
    paid.set(l.offerId, (paid.get(l.offerId) || 0) + l.quantity);
  const totals = new Map<string, number>();
  for (const l of [...existing, ...requested])
    totals.set(l.offerId, (totals.get(l.offerId) || 0) + l.quantity);
  return [...totals].some(([id, n]) => n > (paid.get(id) || 0))
    ? ["Allocation exceeds the paid item quantities."]
    : [];
}
export function formatMoney(minor: string | number, currency: string) {
  const f = new Intl.NumberFormat("en", { style: "currency", currency });
  const decimals = f.resolvedOptions().maximumFractionDigits ?? 2;
  return f.format(Number(minor) / 10 ** decimals);
}

import { z } from "zod";
import departments from "@/data/departments.json";
export const sectionIds = [
  "missions",
  "featured",
  "demand",
  "discovery",
  "value",
  "departments",
  "more",
  "budgets",
  "help",
] as const;
export const imageUrl = z
  .string()
  .max(1500)
  .refine(
    (v) =>
      (/^\/brand\/[a-zA-Z0-9_./-]+$/.test(v) && !v.split("/").includes("..")) ||
      (() => {
        try {
          const u = new URL(v);
          return u.protocol === "https:" && !u.username && !u.password;
        } catch {
          return false;
        }
      })(),
    "Use an HTTPS image URL or an existing /brand/ image.",
  );
export const localLink = z
  .string()
  .max(500)
  .regex(/^\/(?!\/)[a-zA-Z0-9/?=&%#_.-]*$/, "Use a link within Plentovo.");
export const slideSchema = z
  .object({
    title: z.string().trim().min(2).max(80),
    text: z.string().trim().max(160),
    image: imageUrl,
    href: localLink,
    action: z.string().trim().min(2).max(45),
  })
  .strict();
export const storeSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    theme: z.enum(["original", "summer", "festive", "calm"]),
    slides: z.array(slideSchema).min(1).max(12),
    sectionOrder: z
      .array(z.enum(sectionIds))
      .length(sectionIds.length)
      .refine(
        (a) => new Set(a).size === a.length,
        "Each section must appear once.",
      ),
    hiddenSections: z.array(z.enum(sectionIds)).max(sectionIds.length),
    missionSlugs: z
      .array(z.string().regex(/^[a-z0-9-]+$/))
      .min(1)
      .max(15),
    featuredTitle: z.string().trim().min(2).max(70),
    featuredSlugs: z
      .array(z.string().regex(/^[a-z0-9-]+$/))
      .max(24)
      .refine(
        (a) => new Set(a).size === a.length,
        "Remove duplicate products.",
      ),
  })
  .strict();
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(180);
const category = z
  .string()
  .refine(
    (v) => departments.some((d) => d.slug === v),
    "Choose an existing department.",
  );
const common = {
  slug,
  name: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(3000),
  details: z.string().max(16000),
  images: z.array(imageUrl).min(1).max(12),
  category,
  collections: z.array(category).min(1).max(12),
  status: z.enum(["active", "archived"]),
};
export const supplierSchema = z
  .object({ ...common, source: z.literal("supplier") })
  .strict();
export const manualSchema = z
  .object({
    ...common,
    source: z.literal("manual"),
    sku: z.string().trim().min(1).max(100),
    variants: z
      .array(
        z
          .object({
            id: slug,
            title: z.string().trim().min(1).max(100),
            price: z
              .number()
              .positive()
              .max(1000000)
              .refine(
                (n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.0001,
                "Use at most two decimals.",
              ),
            stock: z.number().int().min(0).max(1000000),
            weightGrams: z.number().int().positive().max(1000000),
            image: imageUrl.optional(),
          })
          .strict(),
      )
      .min(1)
      .max(40)
      .refine(
        (a) => new Set(a.map((v) => v.id)).size === a.length,
        "Variant IDs must be unique.",
      ),
  })
  .strict();
export const productSchema = z.discriminatedUnion("source", [
  supplierSchema,
  manualSchema,
]);
export type CmsProduct = z.infer<typeof productSchema>;
export type StoreConfig = z.infer<typeof storeSchema>;
export type CmsKind = "product" | "storefront";
export function canCms(
  admin: boolean,
  grants: { role: string; market_code: string | null }[],
  kind: CmsKind,
  publish = false,
) {
  return (
    admin ||
    grants.some(
      (g) =>
        (!g.market_code || g.market_code === "ZA") &&
        (g.role === "MANAGER" ||
          (!publish &&
            (kind === "product"
              ? g.role === "CATALOGUE"
              : g.role === "MARKETING"))),
    )
  );
}
export const themes = {
  original: { accent: "#DA292B", background: "#F7F6F3" },
  summer: { accent: "#DA292B", background: "#FFF9EF" },
  festive: { accent: "#B91F25", background: "#FAF5EE" },
  calm: { accent: "#DA292B", background: "#F3F5F0" },
} as const;
export function validateSchedule(start: string | null, end: string | null) {
  const from = start ? new Date(start) : new Date();
  const until = end ? new Date(end) : null;
  if (
    !Number.isFinite(from.getTime()) ||
    (until && (!Number.isFinite(until.getTime()) || until <= from))
  )
    throw new Error("End time must follow the start time.");
  return { from, until };
}

export class CmsError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

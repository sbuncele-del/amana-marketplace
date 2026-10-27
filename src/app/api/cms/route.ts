import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { commerceActor, CommerceError } from "@/lib/commerce/access";
import {
  requireOrigin,
  commerceFailure,
  privateHeaders,
} from "@/lib/commerce/http";
import {
  CmsError,
  canCms,
  productSchema,
  storeSchema,
  validateSchedule,
  type CmsKind,
} from "@/lib/cms/domain";
import {
  cmsDocument,
  cmsHistory,
  saveCms,
  releaseCms,
  cancelCms,
  liveCms,
} from "@/lib/cms/store";
import { getSupplierSnapshot } from "@/lib/catalogue";
import { experiencePool } from "@/lib/experience/store";
import departments from "@/data/departments.json";
import { defaultStore } from "@/lib/cms/defaults";
import { shoppingMissions } from "@/lib/shopping-missions";
const envelope = z
  .object({
    action: z.enum(["save", "publish", "restore", "cancel"]),
    kind: z.enum(["product", "storefront"]),
    key: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .max(180),
    version: z.number().int().nonnegative(),
    payload: z.unknown().optional(),
    start: z.string().nullable().optional(),
    end: z.string().nullable().optional(),
    release: z.string().uuid().optional(),
  })
  .strict();
function failure(e: unknown) {
  if (e instanceof CmsError)
    return NextResponse.json({ error: e.message }, { status: e.status });
  if (e instanceof z.ZodError)
    return NextResponse.json(
      {
        error: e.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      },
      { status: 400 },
    );
  return commerceFailure(e);
}
export async function GET(r: NextRequest) {
  try {
    const a = await commerceActor();
    const kind: CmsKind =
      r.nextUrl.searchParams.get("kind") === "storefront"
        ? "storefront"
        : "product";
    if (!canCms(a.admin, a.grants, kind))
      throw new CommerceError(
        403,
        "Your administrator must assign catalogue or marketing access.",
      );
    const key = r.nextUrl.searchParams.get("key");
    const permissions = {
      product: canCms(a.admin, a.grants, "product"),
      storefront: canCms(a.admin, a.grants, "storefront"),
      publish: canCms(a.admin, a.grants, kind, true),
    };
    const live = await liveCms();
    if (key) {
      const doc = await cmsDocument(kind, key);
      const history = await cmsHistory(kind, key);
      let draft = doc?.draft;
      if (!draft && kind === "storefront" && key === "plentovo")
        draft = defaultStore;
      if (!draft && kind === "product") {
        const p = getSupplierSnapshot().find((p) => p.slug === key);
        if (p)
          draft = {
            source: "supplier",
            slug: p.slug,
            name: p.name,
            description: p.description,
            details: p.details || "",
            images: p.images,
            category: p.category.slug,
            collections: p.collections.filter((c) =>
              departments.some((d) => d.slug === c),
            ),
            status: "active",
          };
      }
      if (!draft) throw new CommerceError(404, "Product not found.");
      return NextResponse.json(
        {
          draft,
          version: doc?.version || 0,
          ...history,
          permissions,
          departments,
          missions: shoppingMissions.map((m) => ({
            slug: m.slug,
            title: m.shortTitle,
          })),
          published:
            kind === "product"
              ? live.products.find((p) => p.slug === key) || null
              : live.store,
        },
        { headers: privateHeaders },
      );
    }
    const q = (r.nextUrl.searchParams.get("q") || "")
      .toLowerCase()
      .slice(0, 150);
    const page = Math.max(
      1,
      Math.min(10000, Number(r.nextUrl.searchParams.get("page")) || 1),
    );
    // Include manual drafts, even before their first publication.
    await cmsDocument("storefront", "plentovo");
    const docs = (
      await experiencePool().query(
        "SELECT key,draft,version FROM cms_documents WHERE kind='product' ORDER BY key",
      )
    ).rows;
    const edits = new Map(docs.map((d) => [d.key, d]));
    const active = new Map(live.products.map((p) => [p.slug, p]));
    const rows = [
      ...getSupplierSnapshot().map((p) => ({
        slug: p.slug,
        name: edits.get(p.slug)?.draft.name || p.name,
        source: "supplier",
        status: active.get(p.slug)?.status || "active",
        draft: edits.has(p.slug),
        price: p.price,
      })),
      ...docs
        .filter((d) => d.draft.source === "manual")
        .map((d) => ({
          slug: d.key,
          name: d.draft.name,
          source: "manual",
          status: active.get(d.key)?.status || "unpublished",
          draft: true,
          price: d.draft.variants[0]?.price,
        })),
    ].filter((p) => !q || `${p.name} ${p.slug}`.toLowerCase().includes(q));
    return NextResponse.json(
      {
        products: rows.slice((page - 1) * 30, page * 30),
        total: rows.length,
        page,
        permissions,
        departments,
      },
      { headers: privateHeaders },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(r: NextRequest) {
  try {
    requireOrigin(r);
    if (process.env.VERCEL_ENV === "preview")
      throw new CommerceError(
        403,
        "Saving and publishing are disabled in preview to protect the live database.",
      );
    const a = await commerceActor();
    const text = await r.text();
    if (text.length > 180000)
      throw new CommerceError(413, "This draft is too large.");
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      throw new CommerceError(400, "Invalid request.");
    }
    const b = envelope.parse(json);
    if (!canCms(a.admin, a.grants, b.kind, b.action !== "save"))
      throw new CommerceError(403, "A store manager must publish this change.");
    if (b.kind === "storefront" && b.key !== "plentovo")
      throw new CommerceError(400, "Unknown store.");
    if (b.action === "save") {
      const payload =
        b.kind === "product"
          ? productSchema.parse(b.payload)
          : storeSchema.parse(b.payload);
      if (b.kind === "product") {
        const p = productSchema.parse(payload);
        if (p.slug !== b.key)
          throw new CommerceError(400, "Product handle cannot change.");
        const supplier = getSupplierSnapshot().some((s) => s.slug === p.slug);
        if ((p.source === "supplier") !== supplier)
          throw new CommerceError(
            400,
            "This handle belongs to a different product source.",
          );
        if (!p.collections.includes(p.category))
          throw new CommerceError(
            400,
            "Include the primary department in collections.",
          );
      } else {
        const s = storeSchema.parse(payload);
        if (
          s.missionSlugs.some(
            (slug) => !shoppingMissions.some((m) => m.slug === slug),
          )
        )
          throw new CommerceError(400, "Choose existing shopping ideas.");
        const manuals = (
          await experiencePool().query(
            "SELECT key FROM cms_documents WHERE kind='product'",
          )
        ).rows;
        const handles = new Set([
          ...getSupplierSnapshot().map((p) => p.slug),
          ...manuals.map((p) => p.key),
        ]);
        if (s.featuredSlugs.some((slug) => !handles.has(slug)))
          throw new CommerceError(
            400,
            "A featured product handle was not found. Choose an existing product.",
          );
      }
      return NextResponse.json(
        await saveCms(a.id, b.kind, b.key, payload, b.version),
        { headers: privateHeaders },
      );
    }
    if (b.action === "cancel") {
      if (!b.release) throw new CommerceError(400, "Choose a release.");
      await cancelCms(a.id, b.kind, b.key, b.release);
      return NextResponse.json({ ok: true }, { headers: privateHeaders });
    }
    if (b.action === "restore" && !b.release)
      throw new CommerceError(400, "Choose a previous release.");
    try {
      validateSchedule(b.start || null, b.end || null);
    } catch {
      throw new CommerceError(
        400,
        "Enter valid start and end dates; end must follow start.",
      );
    }
    if (b.kind === "product" && b.end)
      throw new CommerceError(
        400,
        "Product changes do not expire. Publish another change to replace them.",
      );
    return NextResponse.json(
      await releaseCms(
        a.id,
        b.kind,
        b.key,
        b.version,
        b.start || null,
        b.end || null,
        b.action === "restore" ? b.release : undefined,
      ),
      { headers: privateHeaders },
    );
  } catch (e) {
    return failure(e);
  }
}

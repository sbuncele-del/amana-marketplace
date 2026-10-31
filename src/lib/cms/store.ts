import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { unstable_cache } from "next/cache";
import {
  saveCmsWithClient,
  releaseCmsWithClient,
  cancelCmsWithClient,
  liveReleaseSql,
} from "./repository";
import { experiencePool, transaction } from "@/lib/experience/store";
import { cmsSchema } from "./schema";
import { defaultStore } from "./defaults";
import {
  productSchema,
  storeSchema,
  type CmsKind,
  type CmsProduct,
} from "./domain";
let ready: Promise<void> | undefined;
export async function ensureCms() {
  return (ready ??= transaction(async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(792046323)");
    await c.query(cmsSchema);
  }).catch((e) => {
    ready = undefined;
    throw e;
  }));
}
async function readLiveCms() {
  if (!process.env.DATABASE_URL)
    return { products: [] as CmsProduct[], store: defaultStore };
  await ensureCms();
  const rows = (await experiencePool().query(liveReleaseSql, [new Date()]))
    .rows;
  return {
    products: rows
      .filter((r) => r.kind === "product")
      .map((r) => productSchema.parse(r.payload)),
    store: rows.some((r) => r.kind === "storefront" && r.key === "plentovo")
      ? storeSchema.parse(
          rows.find((r) => r.kind === "storefront" && r.key === "plentovo")
            .payload,
        )
      : defaultStore,
  };
}
// Read fresh on every request. Using this opts the page out of caching.
export const liveCms = cache(async () => {
  await connection();
  return readLiveCms();
});
// Same data, reused for up to 5 minutes. Pages that read it can be cached (product pages, sitemaps). Publishing or a
// scheduled release can therefore take up to 5 minutes to show on those pages.
export const liveCmsCached = cache(
  unstable_cache(readLiveCms, ["cms-live-v1"], { revalidate: 300 }),
);
export async function cmsDocument(kind: CmsKind, key: string) {
  await ensureCms();
  return (
    (
      await experiencePool().query(
        "SELECT * FROM cms_documents WHERE kind=$1 AND key=$2",
        [kind, key],
      )
    ).rows[0] || null
  );
}
export async function cmsHistory(kind: CmsKind, key: string) {
  await ensureCms();
  const [history, releases] = await Promise.all([
    experiencePool().query(
      "SELECT id,action,actor_id,created_at FROM cms_history WHERE kind=$1 AND key=$2 ORDER BY created_at DESC LIMIT 30",
      [kind, key],
    ),
    experiencePool().query(
      "SELECT id,payload,starts_at,ends_at,cancelled_at,created_at,created_by FROM cms_releases WHERE kind=$1 AND key=$2 ORDER BY created_at DESC LIMIT 30",
      [kind, key],
    ),
  ]);
  return { history: history.rows, releases: releases.rows };
}
export async function saveCms(
  actor: string,
  kind: CmsKind,
  key: string,
  payload: unknown,
  expected: number,
) {
  await ensureCms();
  return transaction((c) =>
    saveCmsWithClient(c, actor, kind, key, payload, expected),
  );
}
export async function releaseCms(
  actor: string,
  kind: CmsKind,
  key: string,
  version: number,
  start: string | null,
  end: string | null,
  restore?: string,
) {
  await ensureCms();
  return transaction((c) =>
    releaseCmsWithClient(c, actor, kind, key, version, start, end, restore),
  );
}
export async function cancelCms(
  actor: string,
  kind: CmsKind,
  key: string,
  release: string,
) {
  await ensureCms();
  return transaction((c) => cancelCmsWithClient(c, actor, kind, key, release));
}

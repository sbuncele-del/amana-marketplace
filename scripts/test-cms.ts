import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import type { PoolClient } from "pg";
import { cmsSchema } from "../src/lib/cms/schema";
import { defaultStore } from "../src/lib/cms/defaults";
import {
  canCms,
  productSchema,
  storeSchema,
  validateSchedule,
  type CmsProduct,
} from "../src/lib/cms/domain";
import { applyEditorial } from "../src/lib/cms/editorial";
import {
  saveCmsWithClient,
  releaseCmsWithClient,
  cancelCmsWithClient,
  liveReleaseSql,
} from "../src/lib/cms/repository";
async function main() {
  const db = new PGlite();
  await db.exec(cmsSchema);
  await db.exec(cmsSchema);
  // Advisory locks serialize concurrent writers in PostgreSQL. PGlite runs one connection.
  await db.exec(
    "CREATE FUNCTION pg_advisory_xact_lock(integer) RETURNS void LANGUAGE SQL AS $$ SELECT $$;",
  );
  let executor: { query: typeof db.query } = db;
  const client = {
    query: async (sql: string, args?: unknown[]) => {
      const r = await executor.query(sql, args);
      return { ...r, rowCount: r.affectedRows };
    },
  } as unknown as PoolClient;
  const tx = <T>(fn: () => Promise<T>) =>
    db.transaction(async (t) => {
      executor = t;
      try {
        return await fn();
      } finally {
        executor = db;
      }
    });
  const base = {
    slug: "test-chair",
    name: "Test Chair",
    description: "A comfortable chair for everyday use.",
    details: "",
    images: ["/brand/plentovo-living.webp"],
    category: "furniture",
    collections: ["furniture"],
    status: "active" as const,
    source: "supplier" as const,
  };
  assert.ok(productSchema.safeParse(base).success);
  assert.ok(!productSchema.safeParse({ ...base, price: 1 }).success);
  assert.ok(
    !productSchema.safeParse({ ...base, images: ["javascript:alert(1)"] })
      .success,
  );
  assert.ok(
    !productSchema.safeParse({ ...base, images: ["/brand/../secret"] }).success,
  );
  assert.ok(storeSchema.safeParse(defaultStore).success);
  assert.ok(
    !storeSchema.safeParse({
      ...defaultStore,
      sectionOrder: defaultStore.sectionOrder.map(() => "missions"),
    }).success,
  );
  const manual = {
    ...base,
    source: "manual" as const,
    slug: "new-chair",
    sku: "CHAIR-1",
    variants: [
      {
        id: "standard",
        title: "Standard",
        price: 199.99,
        stock: 2,
        weightGrams: 1000,
      },
    ],
  };
  assert.ok(productSchema.safeParse(manual).success);
  assert.ok(
    !productSchema.safeParse({
      ...manual,
      variants: [...manual.variants, ...manual.variants],
    }).success,
  );
  assert.ok(
    !productSchema.safeParse({
      ...manual,
      variants: [{ ...manual.variants[0], stock: -1 }],
    }).success,
  );
  assert.equal(
    canCms(false, [{ role: "CATALOGUE", market_code: "ZA" }], "product"),
    true,
  );
  assert.equal(
    canCms(false, [{ role: "CATALOGUE", market_code: "ZA" }], "product", true),
    false,
  );
  assert.equal(
    canCms(false, [{ role: "MARKETING", market_code: "ZA" }], "product"),
    false,
  );
  assert.equal(
    canCms(false, [{ role: "MANAGER", market_code: "US" }], "storefront", true),
    false,
  );
  assert.equal(canCms(true, [], "product", true), true);
  assert.throws(() => validateSchedule("bad", null));
  assert.throws(() => validateSchedule("2026-01-02", "2026-01-01"));
  const live = async (at = new Date()) =>
    (
      await db.query<{ kind: string; key: string; payload: CmsProduct }>(
        liveReleaseSql,
        [at],
      )
    ).rows;
  await tx(() =>
    saveCmsWithClient(client, "editor", "product", base.slug, base, 0),
  );
  assert.equal((await live()).length, 0, "Draft must not affect store");
  await assert.rejects(
    tx(() =>
      saveCmsWithClient(client, "editor", "product", base.slug, base, 0),
    ),
    /colleague/,
  );
  const past = "2026-01-01T00:00:00Z";
  const release = await tx(() =>
    releaseCmsWithClient(
      client,
      "manager",
      "product",
      base.slug,
      1,
      past,
      null,
    ),
  );
  assert.equal((await live())[0].payload.name, base.name);
  await assert.rejects(
    tx(() =>
      releaseCmsWithClient(
        client,
        "manager",
        "product",
        base.slug,
        1,
        past,
        null,
      ),
    ),
    /changed/,
  );
  await tx(() =>
    saveCmsWithClient(
      client,
      "editor",
      "product",
      base.slug,
      { ...base, status: "archived" },
      2,
    ),
  );
  await tx(() =>
    releaseCmsWithClient(
      client,
      "manager",
      "product",
      base.slug,
      3,
      "2026-01-02T00:00:00Z",
      null,
    ),
  );
  const supplier = {
    ...base,
    price: 450,
    category: { slug: "furniture", name: "Furniture" },
  };
  let rows = applyEditorial(
    [supplier],
    (await live()).map((r) => r.payload),
    () => supplier,
  );
  assert.equal(rows.length, 0, "Archive removes supplier item");
  await tx(() =>
    releaseCmsWithClient(
      client,
      "manager",
      "product",
      base.slug,
      4,
      "2026-01-03T00:00:00Z",
      null,
      release.id,
    ),
  );
  rows = applyEditorial(
    [supplier],
    (await live()).map((r) => r.payload),
    () => supplier,
  );
  assert.equal(
    rows[0].price,
    450,
    "Editorial restore preserves supplier price",
  );
  await tx(() =>
    saveCmsWithClient(client, "editor", "product", manual.slug, manual, 0),
  );
  await tx(() =>
    releaseCmsWithClient(
      client,
      "manager",
      "product",
      manual.slug,
      1,
      past,
      null,
    ),
  );
  assert.equal((await live()).length, 2);
  await tx(() =>
    saveCmsWithClient(
      client,
      "editor",
      "storefront",
      "plentovo",
      defaultStore,
      0,
    ),
  );
  await tx(() =>
    releaseCmsWithClient(
      client,
      "manager",
      "storefront",
      "plentovo",
      1,
      past,
      null,
    ),
  );
  await tx(() =>
    saveCmsWithClient(
      client,
      "editor",
      "storefront",
      "plentovo",
      { ...defaultStore, name: "Seasonal campaign" },
      2,
    ),
  );
  const campaign = await tx(() =>
    releaseCmsWithClient(
      client,
      "manager",
      "storefront",
      "plentovo",
      3,
      "2027-01-01T00:00:00Z",
      "2027-02-01T00:00:00Z",
    ),
  );
  const theme = async (at: string) =>
    (await live(new Date(at))).find((r) => r.kind === "storefront")
      ?.payload as unknown as { name: string };
  assert.equal((await theme("2026-12-31")).name, defaultStore.name);
  assert.equal((await theme("2027-01-15")).name, "Seasonal campaign");
  assert.equal((await theme("2027-02-02")).name, defaultStore.name);
  await tx(() =>
    cancelCmsWithClient(
      client,
      "manager",
      "storefront",
      "plentovo",
      campaign.id,
    ),
  );
  assert.equal((await theme("2027-01-15")).name, defaultStore.name);
  await assert.rejects(
    tx(() =>
      cancelCmsWithClient(
        client,
        "manager",
        "storefront",
        "plentovo",
        campaign.id,
      ),
    ),
    /cancelled/,
  );
  assert.ok(
    Number(
      (await db.query<{ count: string }>("SELECT count(*) FROM cms_history"))
        .rows[0].count,
    ) >= 10,
  );
  await db.close();
  console.log(
    "CMS checks passed: drafts, permissions, validation, archive, supplier integrity, optimistic concurrency, manual products, scheduling, expiry, cancel, restore and audit.",
  );
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});

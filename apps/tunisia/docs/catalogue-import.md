# Catalogue import (Tunisia)

Imports the Shipper **account catalogue** into a Tunisia-only Postgres database, keeps price and stock
fresh, and serves the storefront one page at a time. Checkout stays closed; nothing here creates orders,
buys anything or writes to Shipper (the client only issues `GET /products`).

Read `docs/shipper-bulk-catalogue-request.md` first: the public API cannot list or enrol marketplace
products, and has no image or description fields, so content comes from a separate validated feed.

## Flow

```
Shipper GET /products ──► runImport (paged, checkpointed) ──► tn_products / tn_items  ──► storefront (24 per page)
                                   ▲                                 ▲
validated content files ──► content-import ──► tn_content ──► reevaluate (match + publish state)
```

* **Sync** (`lib/import/runner.ts`): reads 100 products per page. Each page is written in one transaction
  together with the checkpoint (`tn_import_runs.next_page`), so a crash or timeout resumes at the next page
  and never double-counts. A lease lets only one run proceed at a time. A paused run older than 30 minutes is
  abandoned so prices never stay half-refreshed.
* **Retries and limits** (`lib/import/client.ts`): retries 5xx and network errors with jittered backoff,
  honours `Retry-After` on 429, paces calls under 120/min, and pauses the run instead of sleeping past its time
  budget. 401/403/404/422 are not retried.
* **Duplicate protection**: product UUID is the primary key and writes are upserts; a UUID repeated within a page
  is skipped and reported; slugs are unique (collisions get a UUID suffix).
* **Missing products**: only a run that read every page may mark unseen products missing (unpublished). An empty
  response never unpublishes the catalogue.
* **Variants**: each sellable unit is a row in `tn_items`, keyed by the **variant UUID** (or the product UUID when
  there are no variants) – this is the id used on Shipper order items. Removed variants disappear.
* **Freshness**: pages trigger a background sync after the response when data is older than
  `TUNISIA_SYNC_FRESHNESS_MINUTES`. `GET /tunisia/api/cron/sync` (bearer `CRON_SECRET`) does the same on demand
  or from a scheduler; repeat calls resume until `status: "complete"`. We did not add a Vercel cron schedule
  because the allowed frequency depends on the Vercel plan.
* **Fallback**: until the database holds a completed sync (or if it is unreachable), the storefront serves the
  live account catalogue exactly as before, now paginated server-side (limit raised from 20 to 200 pages).

## Publishing rules (`lib/import/decide.ts`)

An item is **published** only if it is active, still in the account, has content in English, French and Arabic
(title and description), at least one image on an allowed host, no unreviewed translations, and a valid price.
Otherwise it is **pending** with reasons, or **failed** when supplier data cannot be parsed
(`invalid_price`, `invalid_stock`). Reasons: `inactive`, `missing_from_account`, `no_content`, `ambiguous_content`,
`no_image`, `incomplete_title_*`, `incomplete_description_*`, `translation_needs_review`, `no_price`,
`price_below_cost`.

Content is matched to account products by the same UUID, then by a path segment of the product `link`
(exact segment, never a substring), then by a *unique* exact name. Duplicate names are `ambiguous_content`.

## Pricing (`lib/import/pricing.ts`)

1. **account**: the selling price on our Shipper account (`price`).
2. **supplier_recommended**: used only if Shipper provides a recommended price and a field name is set in
   `TUNISIA_SHIPPER_RECOMMENDED_FIELD` (none exists today).
3. **provisional**: only when `TUNISIA_PROVISIONAL_PRICING=markup`. `cost × (1 + markup%)`, at least
   `cost + TUNISIA_PROVISIONAL_MIN_MARGIN_MILLIMES`, rounded **up** to `TUNISIA_PROVISIONAL_ROUNDING_MILLIMES`.
   The markup has no default: enabling the mode without one is a configuration error.

The basis is stored on every item and counted in the report, so provisional prices are never mistaken for supplier
or account prices. Supplier cost is never used as a price, a zero or negative price is never published, and a
price at or below cost is held (`price_below_cost`) unless `TUNISIA_BLOCK_BELOW_COST=false`.
Cost stays in the database; public queries select explicit columns and never return it.

## Content and languages

`npm run catalogue:content` loads JSON arrays (default `data/shipper-content.json` and `data/content/*.json`):
`sourceProductId, sourceName, sourceUrl, slug, category, title{en,fr,ar}, description{en,fr,ar}, images[]` plus
optional `provenance{en,fr,ar}` (`supplier|curated|human|machine`), `reviewState` and `rights`. Invalid rows are
rejected with a reason (`--strict` fails the command). It then re-evaluates publish state without calling Shipper.

`--translate` (needs `ANTHROPIC_API_KEY`) fills missing languages with a faithful-translation prompt and marks them
`machine` / `needs_review`. They are held back until someone approves them, unless
`TUNISIA_PUBLISH_MACHINE_TRANSLATIONS=true`. French and Arabic still need native review before launch.

## Reconciliation

`npm run catalogue:report` or `GET /tunisia/api/admin/reconcile` (bearer `TUNISIA_ADMIN_TOKEN`) returns:
run status and checkpoint, `discovered` (rows the API returned), products and items imported, published / pending /
failed counts, pending and failed counts by reason, published counts by price basis, out-of-stock published items,
content match methods, recent failures, and **content awaiting enrolment** (content we hold for marketplace products
that are not in the account yet – the list to enrol in the Shipper app). `scope` is always `account_catalogue` and
`marketplaceDiscoverable` is `false`.

## Running it

```bash
npm ci
# 1. Create tables (idempotent)
TUNISIA_DATABASE_URL=... npm run catalogue:migrate
# 2. Load content, then sync (resumes automatically; repeat if it reports paused)
TUNISIA_DATABASE_URL=... npm run catalogue:content
TUNISIA_DATABASE_URL=... SHIPPER_NETWORK_API_KEY=... npm run catalogue:sync
# Preview without a database (in-memory, nothing persisted; needs the API key in the environment)
SHIPPER_NETWORK_API_KEY=... npm run catalogue:sync -- --dry-run
npm test
```

Never paste the API key into chat or commit it. In Vercel it stays a project secret; run the sync through the
`cron/sync` route or from a trusted shell where the variable is set.

## Storefront scale

The page sends only the visible 24 products (12 on the home page) plus pagination state; filtering and search run in
SQL. The cart keeps only `{id, quantity}` in the browser and checks current price and stock through
`GET /tunisia/api/cart-lines`. Items are removed from a cart only when the server confirms they are gone, so a
temporary outage cannot empty it.

## Not done / needs a decision

* Marketplace-wide discovery and bulk enrolment: blocked on Shipper (see the request document).
* No Vercel cron schedule and no production database provisioned; `TUNISIA_DATABASE_URL`, `CRON_SECRET` and
  `TUNISIA_ADMIN_TOKEN` must be set by the project owner.
* Content for products beyond the first ten, and native review of French and Arabic text.
* Search is substring matching in SQL (as before); full-text ranking can be added if the catalogue grows.

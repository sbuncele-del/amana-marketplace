# Plentovo store management

Open `/operations/store` using an existing team account. Administrators and ZA/global managers can edit and publish. Catalogue staff can save product drafts; marketing staff can save storefront drafts. Staff access remains under the Commerce Console's Access section. Partner approval does not grant store management rights.

## Product work

Search the actual storefront catalogue, open an item, change presentation and save a draft. Supplier prices, availability and variant identities remain supplier controlled. Publish the saved draft to apply it to product pages, search, recommendations, mail selections, feeds and the sitemap. Archive then publish to remove an item; restore an older release to bring its content back. Restoring content does not freeze supplier prices or stock.

Add product creates a manually managed listing. Enter its permanent handle, SKU, images, department, description and variants with ZAR prices, stock and weights. Save, then publish. Manual inventory is not replenished by supplier sync. Checkout remains governed by the existing payment/market gates; this CMS does not enable payments or implement stock reservation.

Image URLs can reference existing `/brand/` assets or HTTPS files. The upload control uses existing Cloudinary credentials and fails clearly if they are absent. JPEG, PNG and WebP files must be below 3 MB. No new storage account or credentials are provisioned by this change.

## Storefront work

Edit the campaign name, curated theme, slide images/copy/links, section visibility/order, shopping ideas and featured product handles. Save before opening **Preview saved storefront draft**. This authenticated preview uses draft storefront content with published product data. It does not publish drafts. Featured picks omit unavailable products and are capped at six visible products per row.

Dates entered in the editor use the operator's device timezone and are stored as timestamps. Blank start means now. The eligible release with the most recent start takes precedence. When a temporary storefront release expires or is cancelled, an older eligible release returns; if none exists, the approved defaults appear. Product publications do not expire. Restore creates a new release with the selected previous content and updates the draft too.

Draft versions prevent two operators from overwriting each other silently. Saving and publishing are transactional; each save, publish, restore and cancellation records actor, time and payload in CMS history. Published overrides are read from the database on each request; configured database failures do not silently ignore archives.

## Deployment and validation

The existing migration script creates only additive `cms_documents`, `cms_releases` and `cms_history` tables/indexes. It never seeds product/customer records. The current approved storefront is retained until a manager publishes a change.

Run `npm run check:cms`, `npm run check:shopping`, and `npx tsc --noEmit`. CMS database checks use isolated in-memory PGlite and call the same mutation functions used by production. PGlite is single-connection; real PostgreSQL advisory locks serialize concurrent writers. Authenticated browser writes, real Cloudinary upload and full production delivery need verification with the configured account/environment before release. Preview authentication configuration is intentionally unchanged.

This release supports one Plentovo storefront and curated campaign themes. It is not a multi-store tenancy system or arbitrary theme-code editor. Manual order, fulfilment and customer-care tools remain in their existing consoles, linked from store management.

Preview deployments are read-only for CMS operations because the current preview database is shared with production. This prevents preview tests from publishing live changes. Authentication environment values are unchanged.

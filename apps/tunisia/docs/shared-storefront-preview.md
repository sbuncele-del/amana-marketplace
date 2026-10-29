# Shared storefront preview

RSA and Tunisia render their home sections, header, footer, slideshow, mission cards and catalogue cards through `packages/storefront`. RSA retains its CMS configuration, authentication, delivery context and catalogue loaders. Tunisia supplies locale strings, TND values, translated links and its existing Shipper catalogue. Section order is a single shared default; empty curated/demand rows stay empty.

Production retains the existing Shipper catalogue loader. When a preview has no API credential, a dated 150-item visual-review sample is read server-side from the existing private database. It contains retail-only fields and synthetic preview IDs; no source/account bindings or costs. No export-derived snapshot is committed to the repository, and the API credential remains production-only. Sample prices/stock are dated 28 October 2026, not a live-sync test. Checkout remains disabled.

Checks: both TypeScript projects; Tunisia production build; existing Shipper/variant tests; shopping relevance/CMS/access tests; shared layout rendering test; explicit French/Arabic category/footer label coverage. Browser checks pending preview deployment.

# Full Shipper catalogue import — coordination and provider request

Target: the entire available Shipper catalogue, advertised as 12,000+ products.
31 is an account-catalogue checkpoint, not completion of that target. Confirm
country eligibility against supplier data; do not invent Tunisia delivery coverage.

## Verified position, 2026-10-28

- Authenticated Shipper My products UI shows 31 account products.
- Supplier content for all 31 is now in data/shipper-content.json.
- Before this content expansion, 10 products were verified on the storefront.
- Product count can exceed account-product count when variants are separate SKUs.
- API selling price and stock refresh is request-driven, cached for 300 seconds;
  it is not a supplier webhook or a guaranteed five-minute background schedule.
- The account selling price is distinct from supplier cost. A cost change does
  not itself establish or recalculate our retail price.
- Checkout remains disabled. No orders or subscriptions were purchased.

## Confirmed API boundary

Official documentation: https://shipper.network/tn/en/documentation/api/
GET /products returns the reseller's account catalogue, max 100 per page.
Documented product responses include UUID/name/price/cost/status/link/stock and
variants, but not images/descriptions or a marketplace enrolment operation.
The current key does not establish access to a whole-marketplace feed.
Do not guess endpoints or collect session credentials from browser internals.

## Bulk-system work for the parallel implementation

Use a separate branch. Keep the approved design and other countries intact.
Build resumable import checkpoints, stable source IDs, duplicate protection,
provider pagination/rate-limit handling, metadata provenance, and reconciled
counts (discovered / enrolled / enriched / published / held / failed).
Do not make 12,000 products client-side props on every request.
The existing loader's 20-page guard is a deliberate current limit, not support
for 12,000 products. Replace it as part of the durable bulk-sync design.
Do not drop the current content file while introducing a persistent catalogue.

Preserve supplier-recommended selling prices when supplied. Missing-price
fallbacks must be configurable, explicitly provisional, and reviewed before
orders open. One provisional account price was set for the 51 mm coffee tamper:
161 TND, using ceil(max(cost * 1.8, cost + 5)). This rule is not a verified landed
margin: delivery, return, tax and other fees are not fully reconciled. Do not
silently label it a supplier recommendation or apply it to already-priced rows.

## Ready-to-send request for Shipper (not sent)

Subject: Full catalogue feed and bulk product enrolment for Plentovo

Hello Shipper team,

We are integrating Plentovo's custom Tunisia storefront at
https://plentovo.com/tunisia/fr/shop and need to import your complete available
catalogue, rather than add thousands of products individually.

Our API connection works, but GET /api/v1/products currently returns only the
products selected into our reseller account. Please provide or enable:

1. A supported bulk-add operation for all eligible marketplace products, or a
   complete catalogue feed/API/export that can be imported programmatically.
2. Product and variant UUIDs, SKUs, titles, descriptions, category paths,
   image/media URLs and confirmation these assets can be used on our store.
3. Supplier costs, suggested retail prices where available, currency/VAT basis,
   variant stock/status, minimum retail-price rules, fees and deposit requirements.
4. Country/warehouse and delivery eligibility, especially Tunisia, so we can
   reconcile the advertised 12,000+ network catalogue with each storefront.
5. Incremental price/stock/status updates, update timestamps, deletion handling,
   rate limits and any supported catalogue webhooks.

Can your team bulk-enrol the eligible catalogue into our account and confirm the
resulting product/variant totals? Please share the documented integration method
and any plan requirements. Do not change our subscription or incur charges
without our approval.

Thank you.

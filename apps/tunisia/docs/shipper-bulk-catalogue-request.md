# What we need from Shipper to import the full catalogue

Status: written 2026-10-28 from the public Shipper Open API documentation
(https://shipper.network/tn/en/documentation/api/), its Postman collection, Shipper's public site
and a read-only check of the live `GET /products` response in the `plentovo-tunisia` build logs.

## What we verified

| Question | Finding |
| --- | --- |
| Can the API list the whole marketplace? | No. `GET /products` "returns your product catalog" (our account only). No marketplace listing or search endpoint is documented. |
| Can the API add (enrol) marketplace products, singly or in bulk? | No such endpoint is documented. The Postman collection lists exactly the documented endpoints and nothing more. |
| Does the API return images, descriptions, categories, brand? | No. The live response has exactly these product fields: `available_qte, cost, link, name, price, sku, status, supplier_identifier, uuid, variants`. |
| Variants? | Yes: `variants[]` with their own `uuid, name, sku, price, cost, available_qte`. The variant UUID is the order item id. |
| Recommended retail price? | No such field. `price` is the selling price on our account; `cost` is the supplier cost. |
| Stock/price change feed or webhook? | Webhooks cover `order.status_changed` and `shipment.status_changed` only. We poll `GET /products` (120 requests/minute, 100 products per page). |
| CSV/XML/bulk export? | None documented. |
| Shopify app? | Shipper has a Shopify app. Its public listing does not say how products reach the store, so we have not relied on it. |

We did not scrape the Shipper web app or call any undocumented endpoint.
So today the importer can sync everything that is **already in our account** (prices, stock,
variants, status) but cannot discover or enrol further marketplace products, and cannot fetch their
images or descriptions through the API.

## Questions to put to Shipper (account manager / support)

1. **Bulk enrolment.** Is there a supported way to add many marketplace products to "My products" at once
   (a bulk action in the app, a CSV upload, or an API endpoint such as `POST /products`)? If it is an
   API, please send the endpoint, request body, and rate limit.
2. **Marketplace feed.** Can you provide a catalogue feed or export (JSON or CSV, ideally an API endpoint)
   of marketplace products open to our account, with: product UUID, SKU, name, **description in French
   (and Arabic/English where you have it)**, **category**, **image URLs**, variants with UUIDs, supplier
   cost, **recommended retail price**, current stock, and an `updated_at` timestamp so we can fetch changes?
3. **Image and text rights.** Are we permitted to reuse your supplier images and product descriptions on
   our own storefront? Please confirm in writing, and say which image hosts are permitted
   (we currently allow only `cdn.shipper.network`).
4. **Pricing fields.** Does `price` on `GET /products` default to your recommended price until we set our
   own? Can `GET /products` include a recommended price, and can we set our selling price by API?
5. **Change notifications.** Can you add product, stock and price webhooks (or an `updated_since` filter),
   so we do not have to poll the whole catalogue?
6. **Product link.** What is the `link` field on a product? If it is the marketplace product URL, we match
   marketplace content to account products with it (account UUIDs differ from marketplace UUIDs).
7. **Limits.** Is 120 reads/minute per key a hard limit for us, and what are the possible `status` values?

## What the importer does today without these answers

* Syncs our account catalogue completely and resumably (prices, stock, variants, status).
* Publishes only products that also have reviewed content (title, description, image) in all three languages.
* Reports everything it cannot publish, with reasons, including content we hold for marketplace products
  that are not yet in our account (the "enrolment worklist" in the reconciliation report).
* Accepts content from any validated JSON feed (`npm run catalogue:content`), so a Shipper export can be
  loaded once it exists with a small adapter.

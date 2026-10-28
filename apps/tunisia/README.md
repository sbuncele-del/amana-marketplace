# Plentovo Tunisia

Independent Next.js storefront foundation, based on production commit
8e63f48d4b37cc368e90f3cf6a235fad694f0614. Uses the approved Plentovo red,
cream, logos, and existing lifestyle/category imagery. No South African
catalogue, database, credentials or checkout API is reused.

## Run

From this directory: `npm ci`, `npm run build`, `npm run dev`.
Open `/tunisia/en`, `/tunisia/fr`, or `/tunisia/ar`. `/tunisia` remembers
the selected language using a Tunisia-scoped preference cookie.

## Vercel

Project: `plentovo-tunisia`; root: `apps/tunisia`; framework: Next.js;
install: `npm ci`; build: `npm run build`; Node: 24.x.
Deploy the feature branch to a preview before changing public routing.
The existing South African project and production domain are not modified.

The app owns the `/tunisia` base path, including assets and API endpoints.
To publish at plentovo.com/tunisia, route `/tunisia` and `/tunisia/:path*`
from the existing domain project to this project's stable production origin,
preserving that prefix. Configure this only after preview checks; do not
attach plentovo.com directly to the Tunisia project. Keep language links,
canonical URLs, robots and indexing checks in the production routing release.
The preview currently has noindex/nofollow metadata.

## Catalogue contract

`data/catalogue.json` is intentionally empty. Items require a unique id and
slug; supplierProductId (variant UUID for a variant); translated `title` and
`description` objects with en/fr/ar keys; category; HTTPS image URL;
`priceMillimes` (positive integer); stock (nonnegative integer); and active
(boolean). Monetary calculations use millimes, formatted as TND to three
places. Invalid data fails validation rather than publishing ambiguous prices.

This file is the first import destination, not a live stock service. Before
orders open, replace it with a Tunisia-only persistent catalogue, authenticated
Shipper import, stock refresh and server-side checkout repricing. The public
API examples do not establish image/description availability or image rights.

## Readiness boundaries

Included: three-language shell, Arabic RTL, search, category inspiration,
product detail templates, stock-limited cart with separate local storage,
checkout layout, and prelaunch tracking/help pages. Product translations
must be supplied for all three languages. No automated translation service
or generation pipeline is connected yet. French/Arabic copy needs native review.

Checkout fields are disabled and POST /tunisia/api/orders always returns 503.
No customer details are saved and no orders are sent to Shipper. The environment
flag in .env.example does not unlock checkout. This is deliberate until:

- Tunisia-only database and durable order/outbox storage are provisioned.
- Account catalogue, fees, coverage and confirmation responsibility are verified.
- Shipper order submission, duplicate protection, retries, signed webhook handling,
  polling recovery, tracking and reconciliation are implemented and tested.
- Address dropdowns are populated from Shipper geography; phone validation added.
- Delivery totals, verified support, returns/privacy/terms are published.
- Transactional notifications and paid/collected/settled states are tested.

`lib/shipper.ts` is a server-side authenticated read boundary only. It does not
submit orders, handle webhooks, import automatically or reconcile COD.
Never copy South African secrets into this project. Store future credentials
in Vercel's environment settings, never in source code or chat.

## Shipper credential and verification

Set `SHIPPER_NETWORK_API_KEY` as a production Secret in this project. The legacy
`TUNISIA_SHIPPER_API_KEY` is also accepted. The build runs three bounded, read-only
checks (geography, catalogue sample, first product detail) and logs only status,
counts and field names. No credentials, product values or customer data are logged.
This verifies access; it does not import products or open ordering.

## Live catalogue

The storefront now reads the paginated account catalogue server-side, cached for
5 minutes. Prices use the supplier account selling price, never cost. Only items
with matched supplier content in `data/shipper-content.json` are published.
Descriptions and images were taken from supplier product pages; English/Arabic
text summarizes or translates those facts. Variant UUIDs are retained.
Private supplier cost fields are excluded from browser props. Failed reads
withhold products; no stock or prices are invented. New account products need
content enrichment before appearing. Checkout remains closed.

## Expanded account catalogue (October 2026)

The public supplier-page capture has been expanded into JSON batches listed in
`data/shipper-content-batches.json`; `data/shipper-content-index.ts` combines these
with the original translated records. Run `node scripts/prepare-supplier-content.mjs
/path/to/captured-content.json` from this app to prepare another reviewed capture.
The input contains sourceName, sourceUrl, description and image URLs, never API
credentials, supplier costs or customer data. Existing translated records stay intact.
New copy is displayed as original supplier text, not claimed to be translated.

The shop displays 48 entries per page, searches the complete loaded catalogue, and
the homepage shows 12 entries with a link to all. Only a selected product receives
full description/gallery props. Account selling price and stock remain request-driven
API reads cached for 300 seconds. This is not background polling or automatic
marketplace enrolment. Invalid prices, inactive listings and ambiguous name matches
are withheld. Stable source links/UUIDs take precedence over unique normalised names.

Build verification now reconciles the complete account catalogue (up to the current
20-page guard), logging counts only. The advertised 12,000+ marketplace still requires
full-feed/bulk-enrolment support and a durable sync pipeline; this capture does not
claim that all 12,000 are available in the account. Checkout remains disabled.

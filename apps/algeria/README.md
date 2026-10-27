# Plentovo Algeria

Independent Next.js storefront foundation, based on production commit
8e63f48d4b37cc368e90f3cf6a235fad694f0614. Uses the approved Plentovo red,
cream, logos, and existing lifestyle/category imagery. No South African
catalogue, database, credentials or checkout API is reused.

## Run

From this directory: `npm ci`, `npm run build`, `npm run dev`.
Open `/algeria/en`, `/algeria/fr`, or `/algeria/ar`. `/algeria` remembers
the selected language (Arabic by default) using an Algeria-scoped preference cookie.

## Vercel

Project: `plentovo-algeria`; root: `apps/algeria`; framework: Next.js;
install: `npm ci`; build: `npm run build`; Node: 24.x.
Deploy the feature branch to a preview before changing public routing.
The South African storefront retains its existing design. Only Algeria-prefixed
routes are forwarded from the main domain.

The app owns the `/algeria` base path, including assets and API endpoints.
To publish at plentovo.com/algeria, route `/algeria` and `/algeria/:path*`
from the existing domain project to this project's stable production origin,
preserving that prefix. Configure this only after preview checks; do not
attach plentovo.com directly to the Algeria project. Keep language links,
canonical URLs, robots and indexing checks in the production routing release.
The preview currently has noindex/nofollow metadata.

## Catalogue contract

`data/catalogue.json` is intentionally empty. Items require a unique id and
slug; supplierProductId (variant UUID for a variant); translated `title` and
`description` objects with en/fr/ar keys; category; HTTPS image URL;
`priceCentimes` (positive integer); stock (nonnegative integer); and active
(boolean). Monetary calculations use centimes, formatted as DZD to two decimal
places. Invalid data fails validation rather than publishing ambiguous prices.

This file is the first import destination, not a live stock service. Before
orders open, replace it with an Algeria-only persistent catalogue, authenticated
Shipper import, stock refresh and server-side checkout repricing. The public
API examples do not establish image/description availability or image rights.

## Readiness boundaries

Included: three-language shell, Arabic RTL, search, category inspiration,
product detail templates, stock-limited cart with separate local storage,
checkout layout, and prelaunch tracking/help pages. Product translations
must be supplied for all three languages. No automated translation service
or generation pipeline is connected yet. French/Arabic copy needs native review.

Checkout fields are disabled and POST /algeria/api/orders always returns 503.
No customer details are saved and no orders are sent to Shipper. The environment
flag in .env.example does not unlock checkout. This is deliberate until:

- Algeria-only database and durable order/outbox storage are provisioned.
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

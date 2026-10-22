# Plentovo commerce foundation

This additive layer sits beneath the existing storefront. It does not enable payments, replace the current supplier feed, send orders to suppliers, or publish country launches automatically.

## Entry points

- `/operations/commerce`: current active ADMIN accounts manage markets, partner approvals and account access. Scoped managers, catalogue staff, fulfilment staff and marketing readers receive country-limited access.
- `/partner`: signed-in applicants submit a seller or fulfilment application. Approved members can update only their partner inventory and assigned shipments.
- `/api/commerce/markets`: active market discovery with remembered choice, verified Vercel country hint and safe fallback. POST confirms an active market in a cookie. Storefront integration remains a subsequent change.
- `/api/commerce/command`: authenticated team operations.
- `/api/commerce/partner`: authenticated applicant and approved partner operations.

All mutations verify same-origin requests, re-read active account and membership permissions, validate payloads, write audit history within the transaction, and use row versions for reviews and partner changes. No API keys or supplier identity are returned by the public market endpoint. Recipient addresses are restricted to assigned approved partner memberships.

## Core records

Markets carry country, currency, default/supported locales, readiness checks and preparation/active/suspended state. The country list is data, not a hard-coded Tunisia branch. South Africa is seeded as active for existing browsing, with readiness false; ordering stays globally closed. New activation requires recorded readiness and approved partner coverage. Translation, including right-to-left layout, is not implemented by merely selecting a locale.

Products and variants are shared identities; partner offers hold country, SKU, currency minor-unit cost/retail, stock observation/expiry and delivery range. New or edited commercial offers require manager approval. Existing shared product identity is never overwritten by a country-scoped submission. Stock expires; partner observations cannot move backwards and have a maximum 24-hour validity. A failed supplier refresh invalidates offers instead of inventing availability.

Partners have a pending/approved/rejected/suspended lifecycle. Approval does not prove an integration exists: administrators must record the verification and operating agreement. Current PerfectDealz feed remains separate until an adapter and reconciliation are implemented. No partner, Tunisia readiness, contract, or live stock was fabricated.

## Fulfilment boundary

Assignment requires an ORDER in PAID/FULFILMENT state with country, `paymentVerified: true`, and an immutable `commerceLines: [{offerId, quantity}]` payment snapshot from a future trusted checkout/payment integration. Existing enquiry orders cannot be allocated. The endpoint locks the order, validates partner ownership and aggregate paid quantities, and requires a unique `requestKey` UUID for retry protection. It stores internal assignments; it makes no external dispatch request. Partners progress assigned → accepted/rejected → dispatched (tracking required) → delivered. Partner delivery reports do not automatically mark the customer order delivered or start customer follow-ups.

A later payment integration must create the snapshot and verification flag server-side only after provider verification; clients must never supply these fields. Reservation, payment capture, reconciliation, refund/settlement ledgers, supplier adapters, outbound retry/outbox workers and delivery consolidation remain required before commercial launch. One brand cannot guarantee one parcel without a real consolidation operation.

## Migration and deployment

`npm run build` executes the existing additive experience migration followed by commerce tables under advisory locks. Runtime initialization also safely creates the layer and seeds ZA. No existing table or product data is removed. Database failure fails protected requests closed. No marketplace partner is approved by migration. ADMIN can assign existing active accounts through the console; session role alone never grants access.

Validation: `node --import tsx --test tests/commerce/domain.test.ts`, TypeScript, scoped ESLint, production build, and a PostgreSQL-compatible DDL replay/constraint test. Live authenticated workflows still require the deployment database and real staff accounts. No live payments or supplier orders are used in tests.

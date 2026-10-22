# Amana experience operations

The centre connects the current South African catalogue enquiry flow to durable PostgreSQL records. It is available at `/operations`; `/experience-preview` is an explicitly labelled, local-only demonstration with fictional records. No demo orders or employees are inserted into the database.

## The operating standard

Every person deserves dignity. Use their preferred name, ask before calling, explain the delivered total, own uncertainty and carry the history forward. A delivery is followed by a personal check-in only when the customer requests one. Colleagues record delivery, product and care feedback; an unresolved concern or score of 1–2 creates a recovery case. Resolution requires a recorded customer confirmation. Three unsuccessful contact attempts are referred for review rather than endless calling.

Design the experience around confidence before purchase, clear commitments during fulfilment, practical help getting started, and generous attention during recovery. Never promise compensation, delivery times or refunds that have not been authorised. Coach the people providing care as carefully as the people receiving it.

## Real workflows

- Cart enquiries save verified supplier prices and availability, contact preferences, consent, item snapshots and a reference before the customer continues to WhatsApp. Payment remains a confirmed manual milestone, with a payment reference. This does not automatically charge a card or reserve supplier stock.
- Orders progress enquiry → quoted → confirmed → paid → fulfilment → shipped → delivered. Quotes require a delivery amount; dispatch requires a tracking reference. Paid orders cannot be casually cancelled through this screen.
- Confirming delivery creates one linked, consent-based check-in task due within 24 hours. A declined check-in withdraws the order’s follow-up consent. Callbacks have a chosen time. Staff contact customers themselves; no call, email or WhatsApp message is sent automatically.
- Contact and order-support forms create durable cases. An order reference plus the matching contact number is required to attach a public request to an order; otherwise the customer can send a general enquiry without a reference. Public responses never return order details.
- Every record change has an actor, timestamp and note. Optimistic versions prevent a colleague’s update from being silently overwritten. Team/access changes have their own audit log.
- Existing legacy marketplace `Order` records are not migrated automatically. New catalogue enquiries use `experience_records`; legacy transactions, external payment platforms, couriers, email inboxes, telephony and helpdesk systems need explicit adapters before their activity can be presented as connected.

## People and access

Existing active ADMIN accounts have organisation-wide access. Only an administrator creates teams and adds, removes or changes memberships for existing active store accounts. AGENT can work records in their assigned teams. LEAD can assign and confirm milestones in their teams. MANAGER also sees and manages descendant teams in the reporting hierarchy. Access is checked against the database on every request, including active status; the browser’s role is not trusted as authority.

Build country → department → team structures rather than a single queue for 20,000 colleagues. Teams have a planning capacity, active headcount, open responsibilities, unassigned work and overdue work. The colleague directory and work queues are paginated. The 20,000-person model is an organisational design target, not a completed concurrency/load certification. Before that rollout, validate pooled database connections, indexes and query plans against representative order volumes; add SSO/MFA, dedicated background processing, queue-specific SLA calendars, permission/audit administration, retention rules, disaster-recovery exercises and load tests. Dashboards expose due responsibilities, but no background worker sends or escalates time-based notifications yet.

## Persistence and deployment

`npm run build` generates Prisma and runs `scripts/migrate-experience.ts` before building Next.js. Migration uses the existing `DATABASE_URL`, a transaction, an advisory lock, additive `CREATE … IF NOT EXISTS` DDL and idempotent default-team insertion. It does not drop, rename or rewrite existing commerce tables. The runtime also checks the schema when first used. Missing database configuration skips local migration. Unresolvable or unreachable database addresses defer the migration so browsing and the explicit manual WhatsApp route remain available; public persistence and staff authentication still require a repaired database connection. Other migration errors fail the build. The forms never pretend an unsaved request succeeded.

Tables: `experience_teams`, `experience_members`, `experience_records`, `experience_events`, `experience_access_events`, `experience_request_keys`, `experience_rate_limits`. Existing `User` identities remain authoritative. References and idempotency keys prevent retry duplicates; a unique partial index permits one delivery check-in per order. Public submissions have database-backed, hashed-IP rate limits. Private contact information stays in the database, never in the public Git repository or demo fixture.

`GET /api/experience/health` exposes availability only. It reveals no records, counts, credentials or database location. Protected APIs use no-store responses. Internal routes and the preview are excluded from indexing.

## Google connections

Set these through the deployment’s secure environment configuration, never by entering a private key into a customer form:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (actual or escaped newlines supported)
- `GOOGLE_ANALYTICS_PROPERTY_ID` (numeric GA4 property ID)
- `GOOGLE_SEARCH_CONSOLE_SITE_URL` (verified URL-prefix or `sc-domain:` property)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` for the existing storefront GA4 tag

Enable Analytics Data API and Search Console API. Grant the service account read access to the GA4 property and verified Search Console site. The server obtains short-lived OAuth tokens with read-only scopes. Operators cannot view credentials. Google reports are available to administrators and team leaders/managers.

Analytics shows active users and events over the last 30 minutes, cached for 60 seconds. Search Console shows top reported South African query/page combinations over 28 days, cached for 30 minutes. Search reporting is delayed and recent results can be provisional; it is not an all-searches realtime feed. Disconnected or failed integrations are labelled honestly.

## Verification

Run `node --import tsx --test tests/experience-workflows.test.ts`, `node node_modules/typescript/bin/tsc --noEmit`, then `npm run build`. Verify unauthenticated protected APIs return 401, internal pages require sign-in and public preview actions never persist. Exercise real staff workflows in an isolated database before production use: cross-team access, manager hierarchy, inactive users, concurrent edits, idempotency, quote/payment/dispatch gates, delivery consent, low-score recovery and customer-confirmed closure.

## Perfect Dealz reseller operating terms

The owner supplied the supplier’s reseller response on 13 October 2026. Perfect Dealz operates as a retail store: its website prices apply, with no minimum order quantity or separate wholesale price promised. It permits use of the pictures on its website for reseller listings and can deliver to the reseller’s customer or preferred address. Blank/no-price packaging may be requested; record the request rather than treating it as automatically guaranteed. Stock is held at an external warehouse, so confirm specific availability before making firm commitments. Supplier orders must be placed and paid through the supplier’s website; the centre does not send or pay for those orders automatically. Record the supplier order reference and packaging request in the fulfilment milestone note. Delivery fees, delivery terms and the supplier’s returns/refund policy apply to those supplier purchases. Keep the Amana customer quote, customer payment, supplier purchase and courier tracking connected in the order history.

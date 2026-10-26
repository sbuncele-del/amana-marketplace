# Plentovo customer email journeys

## Timing and purpose

- Welcome: immediately after confirmed newsletter opt-in, now recorded in the same queue/activity log with stable send idempotency. Registration alone does not create marketing permission.
- Discovery: three calendar days after confirmation, shifted to the next South African business day, at 10:00 SAST. Useful browsing guidance; no invented discounts or bestsellers.
- Private product feedback: two business days after a confirmed deliveredAt timestamp, at 10:00 SAST. Requires followUpConsent and an email on the order. Never starts from purchase date or an estimated arrival.
- Existing human check-in tasks remain available and do not get silently completed by an email response.

10:00 is an initial operating choice, not a statistically proven best time. Compare delivered-to-click and delivered-to-feedback response rates over at least four weeks before changing timing; low volumes are inconclusive. Do not optimize solely on opens. The team console separates provider acceptance from verified delivery and exposes scheduler runs, errors and feedback. A future randomized time-window test requires a more frequent scheduler; this daily baseline does not claim to perform one.

## Operation

Vercel cron GET /api/cron/lifecycle daily at 08:00 UTC. CRON_SECRET is production-only. The route fails closed without it. Routine discovery creates unique queue entries and claims up to 20 per run with SKIP LOCKED. Queue at scale needs more frequent processing; monitor backlog before exceeding 20 eligible emails per weekday. Weekends, fixed SA public holidays, observed Sunday holidays, Good Friday and Family Day are excluded; additional proclaimed dates can be added using comma-separated ZA_EXTRA_HOLIDAYS.

Only events in the previous seven days are discovered. This is deliberate: no bulk historical enrolment. Queued jobs older than seven days are skipped. Three short provider retries use a stable idempotency key. Unknown send outcomes older than 20 hours are marked failed for review instead of risking a duplicate beyond Resend's 24-hour idempotency lifetime. Do not reset them blindly.

Check active subscription/consent and suppression immediately before sending. Separate lifecycle emails by at least 48 hours. A changed/cancelled order is skipped. No checkout activation or fabricated purchases are part of this change.

Feedback links use 256-bit random tokens in fragments rather than URL query logs, expire 30 days after acceptance, and can be used once. Responses create an event on the order; a score of 1–2 or a request for help creates a high-priority customer-care case. Feedback is not automatically made a public review. Further order check-ins can be declined with the response.

## Validation and release

Run node --import tsx scripts/test-mail-timing.ts, TypeScript noEmit and scoped ESLint. Validate SQL/queue transactions and feedback idempotency without sending real customer emails. After release verify unauthenticated cron access is rejected, the feedback page renders, and the next authenticated scheduler execution appears in the team console. No successful mail delivery is established by a configured API key alone.

## Interest-based day-three discovery

Signup offers one optional relevant-email choice, covering both product emails and using Plentovo searches/views to choose them. A separate versioned boolean prevents older signup clients from accidentally granting the expanded choice. On acceptance, the preference is enabled automatically; My account is for changing it later. Signals require a signed-in active account, explicit relevant-email preference and an ACTIVE confirmed newsletter subscription. Unrelated analytics-cookie acceptance is not required for the separately consented first-party recommendation feature. Search text is transient; store only up to three matched catalogue IDs per search and exact product IDs for product views. Weight a product view more than a search-result impression, deduplicate within 30 minutes and decay older signals when ranking. Never claim search impressions were purchases or exact product views.

At send time, rank recent seeds and similar products, exclude recently paid/shipped/delivered items, refresh variant stock/prices and include up to six relevant products. If preferences are off, history is empty/stale, or all candidates are unavailable, use a general help/discovery message without a supposedly personalised product list. No cross-site tracking or external customer profiling. Anonymous searches are not associated retrospectively with an account.

Disabling the preference deletes stored interests; daily processing purges interest records older than 30 days. Privacy policy describes this. Run node --import tsx scripts/test-email-interests.ts for ranking, purchase-exclusion and expiry checks. This changes the day-three email, not manually authored campaigns.

# Plentovo mobile readiness intervention

Scope: mobile shopping improvements and shared accessibility fixes. Desktop grid/layout and branding are retained. Checkout remains explicitly unavailable pending merchant approval; no order/payment integrations changed.

## Implemented
- Product price/availability near the title on mobile; options precede collapsed details. Mobile purchase bar shares selected variant, quantity, pending/error and cart state with the existing purchase controls, and hides while the main purchase button is in view.
- Label associations, autofill hints, named password controls and 16px mobile fields. Mobile safe-area space and repositioned help button above the purchase bar.
- Newsletter uses Radix modal focus management, Escape dismissal and bounded dynamic-viewport scrolling. Offer requires 45 seconds plus 35% page depth, cookie choice resolved, no open modal and no active form field. Signup/marketing consent semantics remain unchanged.
- Filter drawer open state survives search-parameter changes; pagination wraps. Mobile mission cards are shorter without removing available collections; collection introductions are shorter on mobile. Original compressed image delivery retained: Vercel image optimisation returns HTTP 402 on this account, so enabling it would break images. Responsive source derivatives remain a follow-up performance task.
- Manifest, home-screen icons, user-invoked install guidance and service worker. Cache allowlist contains only offline HTML and two icons. Navigation is network-first; API/non-GET/third-party requests are untouched. No private/catalogue HTML cache.

## Verification
- `npx prisma generate` and `npx tsc --noEmit`.
- `npm run check:shopping` (relevance, availability, budgets, pagination and ownership).
- `node --test tests/mobile-offline.test.mjs` (public-only cache, network-first and API isolation).
- Changed component lint and Vercel preview build.

## Before release acceptance
- Actual Android Chrome and iPhone Safari testing is still required; do not represent source checks as device validation.
- At 320/390/430px: no page overflow; product price/options easy to reach; purchase bar does not cover content or Help; actual variant/quantity added correctly.
- Keyboard: forms remain visible, labels announced, password toggle named, errors visible, signup returns to original route.
- Filters: toggle stock, apply budget, then Show products; URL and results retain both; back/forward restores choices.
- Overlays: cookie choice before newsletter; newsletter defers during help/location/filter modal and typing; Escape restores focus.
- Installation: supported Android prompt, manual iPhone instructions, standalone launch and reconnect fallback; no stale prices/account HTML.
- Desktop regression: header, slideshow, mission cards and three-column product arrangement match approved design.
- Payment success/failure/cancel/duplicate notification/order confirmation are a separate merchant-readiness gate.

## Hosted-preview findings
- Vercel image optimiser returns 402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED. Image delivery now bypasses that paid endpoint globally; source compositions are unchanged.
- Preview authentication settings are absent (NEXTAUTH_SECRET and AUTH_TRUST_HOST exist only for production). Adding a separate branch-scoped preview secret was rejected by automatic approval review and requires explicit user approval. Production secrets were not read or copied.

## 390px live browsing checks
Passed image selection, expanded product details, red variant/mobile add-to-cart, quantity recalculation, collection/free-delivery total, disabled payment, removing test item, combined availability/price filters with drawer staying open, sort, pagination with retained query, empty-search reset, browser back/forward, department search/Escape, Help open/close, bathroom storage+R300 selections and no page-wide horizontal overflow. The test cart was cleared.

Visual findings: mobile header occupied too much height and floating Help overlapped card details. Header spacing/logo/search/shortcut row compacted below 640px only; mobile Help opens the same care dialog from the existing top bar, removing the floating obstruction. Desktop remains unchanged.

# Guided shopping at Plentovo

## Entry points
- /collections: all 15 shopping missions, grouped into rooms, everyday life and out-and-about.
- Homepage: six starting points and an "Explore all 15 shopping ideas" link.
- Main navigation: Help me choose leads to /collections.
- Collection pages link to three further ideas, prioritising the same section, and the full hub.

## Missions
Rooms: kitchen-made-easier, bathroom, bedroom, dining-room, living-room, home-office.
Everyday life: small-space-living, cleaning, laundry, kids-play, baby-essentials, beauty-routine, fitness-at-home.
Out and about: outdoor-living, travel-essentials.

Each mission has four relevant shopping needs, optional live-price maximum budget, practical selection guidance, product links and WhatsApp help. No sign-in or questionnaire is required. Existing product-context recommendations remain in place.

## Dynamic selection and wider browsing
Every request ranks the current catalogue by mission relevance. Validated recent marketing-agent demand picks receive priority only within a relevant group. An item belongs to its first matching group so it cannot duplicate across groups/pages. Snapshot prices influence budget ordering only; they never exclude candidates or determine displayed prices.

Each page considers 12 candidates per selected group (at most 48 unique product feeds, checked in batches of four). All successfully refreshed, available variants with positive prices and an image are shown, up to 48 cards. Price and image come from the same available variant, and budgets are applied to the refreshed price. Real Previous/More ideas anchors browse the remaining matching candidates while preserving need and budget. No candidates are silently discarded between pages. Fewer cards can appear when candidates are unavailable, over budget or supplier checks fail. Empty windows retain More ideas where further candidates exist.

The existing five-minute supplier cache policy applies. Transient supplier throttling/server errors get one bounded retry; repeated failures remain excluded. Snapshot availability only influences candidate order and never proves current stock. No fabricated availability is used as a fallback. Public catalogue reads use ZA, while checkout and delivery authorization remain unchanged. Inspiration images are illustrative and use existing approved assets; actual product cards have actual product images.

## Campaign handoff
All collection URLs are stable destinations for relevant email, Pinterest, social or WhatsApp campaigns. Example: https://plentovo.com/collections/small-space-living?need=kitchen&maxPrice=300.
Small-space creative:
- Subject: Make more room in the home you have.
- Preview: Useful storage and thoughtful furniture, chosen around your space.
- CTA: Find your starting point.
- Use brand-kit assets and actual product photos for product claims.
- Do not label external demand as Plentovo bestseller evidence.
This change sends no emails or social posts and buys no advertising.

## Limits
Need and budget choices apply immediately without new persistent profiling. Existing permission-controlled email personalisation is preserved. No new conversion claims, dimensions, delivery dates, age suitability, safety endorsements or compatibility guarantees are invented. Product budgets do not include delivery costs.

## Verification
npm run check:shopping runs relevance, budget, expanded coverage and pagination checks plus scoped lint before the Vercel build. Next.js performs TypeScript validation during build. Preview HTTP checks cover the hub, rooms, need/budget filters and pagination. Mobile/desktop appearance still needs visual review before production merge.

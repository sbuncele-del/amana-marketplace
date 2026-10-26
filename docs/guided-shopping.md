# Guided shopping at Plentovo

## Customer journey
Homepage "What would make your everyday easier?" links to stable collection URLs:
- /collections/small-space-living
- /collections/kitchen-made-easier
- /collections/outdoor-living

The navigation also exposes "Help me choose". Each collection has optional need and maximum-budget controls, up to four relevant groups of five live-checked products, selection guidance, links to product pages, and WhatsApp assistance. No account or questionnaire is required. Current product-page alternatives and complementary recommendations remain in place.

## Dynamic selection
Shopping missions define purposes and product-type relevance, not fixed SKU lists. Every request considers the current catalogue. Fresh, validated homepage demand picks receive priority only when they match the mission. The existing homepage merchandising record and its seven-day evidence validation remain the agent's update mechanism.

At most 48 unique product feeds are checked per collection request, in batches of eight. Only successfully refreshed, available variants with positive prices and an image are shown. Budget filtering uses the checked available variant's price, not stale snapshot prices. Product cards use the same variant's image. Products are deduplicated across groups. If no suitable products can be confirmed, the customer sees reset/help actions rather than invented availability.

The four-group screen is a guided selection, not the complete matching catalogue. Candidate caps can cause fewer than five results per group. Price filters are maximum product prices, not delivered totals. Supplier response caches follow the existing five-minute policy. Public reads use ZA; checkout and delivery authorization are unchanged.

## Campaign destinations
For the marketing agent's small-space campaign:
- Destination: https://plentovo.com/collections/small-space-living
- Optional context: ?need=kitchen or ?need=bedroom
- Optional product budget: &maxPrice=300
- Suggested subject: Make more room in the home you have.
- Suggested preview: Useful storage and thoughtful furniture, chosen around your space.
- CTA: Find your starting point.
- Visuals: approved existing brand assets for inspiration; actual selected product images for product-specific claims.
- Do not call externally trending products Plentovo bestsellers.

Other mission links can be used directly in relevant email, Pinterest, social and WhatsApp campaigns. This change does not send email, buy advertisements or publish social posts. Do not attach unrelated recipients to a mission. Do not infer whole-home dimensions, installation compatibility, outdoor ratings or delivery promises from a title.

## Personalisation and measurement
Immediate choices (need and budget) control the page without persistent profiling. Existing permission-controlled email personalisation and product-context recommendations are preserved. This release does not widen email consent into new storefront tracking. Page paths and need/budget selections provide stable destinations for existing consent-aware analytics; sales and profit reporting require the live checkout journey. No purchases or conversions are fabricated.

## Verification
Run node --import tsx scripts/test-shopping-missions.ts, TypeScript and scoped lint via Shopping discovery checks. Vercel preview build must pass before review. Verify mobile and desktop layout, need and budget URLs, product cards and WhatsApp destination in the preview. Main is not merged as part of preview preparation.

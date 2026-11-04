# Product-first mobile storefront

Below 640px, RSA and Tunisia homepages use a shared two-column catalogue feed instead of desktop slideshow, mission and discovery sections. At 640px and above, the existing desktop sections retain their layout and order.

RSA loads 24 items per request from the existing catalogue API, preserving supplier price and stock validation. Tunisia paginates the existing grouped catalogue, preserving variants and millime formatting. The next page loads near the viewport, with a manual fallback, retry and empty states. Category switches cancel the previous request and reset pagination. Product slugs deduplicate appended batches. Recent product categories stored for the current session rank relevant products first on the next home visit; no cross-session profile or fabricated sales claims.

A shared fixed bottom bar opens home, categories, help, cart and account. Product links retain existing variant selection and cart validation. Tunisia includes English, French and Arabic navigation and retains language switching. Mobile email prompts and unsolicited assistant invitations are suppressed; help remains available explicitly. The mobile purchase bar sits above navigation.

## Verification

- Shared storefront section-order and browse layout checks.
- Shopping relevance and offline-cache regression checks.
- Mobile server render checks for initial placeholders, English/French/Arabic loading text and unavailable stock.
- Root TypeScript currently reports a pre-existing unknown-result error in tests/tunisia/account.test.ts:74. Tunisia TypeScript passes.

## Boundaries

The existing RSA checkout displays Payment unavailable. This UI change neither configures a payment provider nor claims guest checkout is complete. Algeria retains its separate legacy storefront and needs its own integration before claiming parity. These are web/PWA mobile changes, not a native app-store binary.

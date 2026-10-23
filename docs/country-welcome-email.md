# Country selection and product welcome emails

This review combines the previously reviewed commerce foundation with the merged email system.

- A visible storefront selector reads active markets and saves an explicit choice in the existing HttpOnly market cookie. Its current selection is distinct from the IP-based suggestion.
- Newsletter signups record their country with consent. Selecting general updates leaves country unknown. Historical subscribers remain unknown. A selected signup country also updates the browsing cookie.
- The existing supplier adapter is South African only. Async catalogue reads return no products for other markets, suspended/invalid saved markets, or an unavailable market service. This change does not convert rand prices to another currency or declare another supplier integration ready.
- Confirmed ZA subscriptions get up to four product recommendations with images, links, and the cheapest currently available variant price. Supplier checks are fresh and strict; failed checks omit the product. Selection is bounded to twelve candidates. These are recommendations, not sales-ranked bestsellers.
- Unknown countries, unsupported adapters and failed product checks get a branded fallback rather than incorrect country offers. Existing opt-in, unsubscribe and suppression behavior is retained.
- The confirmation handler allows 60 seconds for up to three concurrent supplier batches. Actual delivery and authenticated workflows still require a test on the deployed review with the configured Resend sender.

Not part of this change: other-country supplier adapters, enabling checkout/payments, historical country backfill, or country-scoped campaign sends. The campaign editor still sends to all confirmed subscribers and must be extended before running country-specific campaigns.

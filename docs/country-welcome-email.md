# Country selection and product welcome emails

This review combines the previously reviewed commerce foundation with the merged email system.

- Vercel country detection preselects the browsing market and opens a first-visit popup: “Visiting from South Africa?” with Continue and Change delivery country actions. A confirmed cookie takes priority. Remember my choice saves a year-long preference; unchecking it saves a session preference. Unsupported detected countries are named explicitly rather than silently mapped to ZA. A compact Deliver to control reopens the dialog.
- Newsletter signups inherit the detected or confirmed shopping country with consent. They do not require a second country dropdown. Without an available country, they receive general updates. Historical subscribers remain unknown. A selected signup country also updates the browsing cookie.
- The existing supplier adapter is South African only. Async catalogue reads return no products for other markets, suspended/invalid saved markets, or an unavailable market service. This change does not convert rand prices to another currency or declare another supplier integration ready.
- Confirmed ZA subscriptions get up to four product recommendations with images, links, and the cheapest currently available variant price. Supplier checks are fresh and strict; failed checks omit the product. Selection is bounded to twelve candidates. These are recommendations, not sales-ranked bestsellers.
- Unknown countries, unsupported adapters and failed product checks get a branded fallback rather than incorrect country offers. Existing opt-in, unsubscribe and suppression behavior is retained.
- The confirmation handler allows 60 seconds for up to three concurrent supplier batches. Actual delivery and authenticated workflows still require a test on the deployed review with the configured Resend sender.

Not part of this change: other-country supplier adapters, enabling checkout/payments, historical country backfill, or country-scoped campaign sends. The campaign editor still sends to all confirmed subscribers and must be extended before running country-specific campaigns.

Popup follow-up validation: TypeScript, scoped lint and production build passed. Ten existing domain/template tests passed. Local interactive browser testing could not run because the Chromium download returned an invalid archive; deployed detection endpoint checks remain the live verification boundary.

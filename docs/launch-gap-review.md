# Launch audit intervention — 27 October 2026

These changes are proposed on the review branch, not released to production.

| Audit finding | Intervention | Remaining evidence / dependency |
| --- | --- | --- |
| Payment unavailable | Keep the existing server/payment gates closed. No Payfast or Paygate checkout adapter or validated live transaction was present in the audited source. | Approved merchant account, bank/compliance completion, secure merchant configuration, implementation and verified payment-notification/order/fulfilment tests. Registration alone does not enable payments. |
| Product health claims | Preserve supplier wording and specifications. Add automated health/device-claim flags to the product editor. No invented replacement claims or approval badges. | Supplier documentation and applicable regulatory review. A supplier description is not proof of regulatory approval. Flagging does not certify or approve a product. |
| Business identity | Publish Masaphokati Global Shelf (Pty) Ltd, 2026/850096/07, 26 Lemonwood Street, Eco-Park Estate, Centurion, Gauteng, 0157, South Africa. Align About, Contact, footer, policies, email footer, chat knowledge and Organization structured data. | Verify inbound customer-care mailbox and phone operation. No VAT number is claimed. Do not publish the incorporation PDF, director IDs or signatures. |
| Delivery at decision point | Show R79 starting tier for under-10 kg orders, 0–2 processing days and 3–5 transit days after dispatch, with a delivery-policy link. | Courier is allocated at dispatch; no named courier contract was evidenced. Bulky/combined order totals use the existing weight bands. |
| Supplier content/images | Remove empty/duplicate/unsafe image references, handle image load failures, clean replacement characters and whitespace, flag questionable punctuation for human review. Preserve the original supplier snapshot and specifications. | This is not a full image-by-image network verification of 10,000 products. Stray question marks are flagged rather than blindly deleting legitimate questions. |
| First-visit overlays | Stop auto-opening the country dialog. Default to the existing ZA browsing range; keep country selection available manually. Cookie choice remains separate from account/marketing consent. | Verify first visit in the deployed browser. Delivery-market gates remain in place. |
| Return visits | Add account-backed wishlist and Save for later on product pages. Link from My account. Existing reviews remain in place. | Price-drop alerts and verified discount history are not implemented. Do not fabricate deals or bestseller claims. |
| Category focus | Preserve the approved layout and use the new CMS featured/mission/section controls to focus campaigns without dropping the broader range. | Owner-approved campaign/category priorities and demand-agent reports; no arbitrary reduction of catalogue coverage. |
| Local fulfilment claim | Replace the unconditional origin claim with “Delivery within South Africa.” | Verify each future supplier's dispatch arrangements before claiming local stock/fulfilment. |
| Dead links | Permanent redirects /delivery, /shipping, /faq → /shipping-faq. | Deployment response verification after release. |

## Sign-in simplification

Both /login and /register use the same email-first flow. Email verification creates a BUYER account only when needed. Existing roles are retained; the server determines the landing workspace from assigned permissions. Partner applications remain separate and approval-gated. Existing passwords remain available as a fallback. No automatic staff/admin assignment and no new auth vendor.

Codes are cryptographically generated, HMAC-protected using the existing auth secret, expire in 10 minutes, allow five verification attempts and are single use. Shared database limits cover email and IP; resend cooldown is 60 seconds. Resend uses the existing transactional sender. Newsletter consent remains optional and separate. Sign-in codes are never logged. New accounts have no invented personal name; account greetings handle a missing name.

Preview deployments block email-code issuance and consumption and wishlist writes because preview and production currently share a database. Existing production authentication configuration and Vercel passkey protections are unchanged. An isolated configured auth environment is required for signed-in end-to-end acceptance testing.

## Validation

Run `npm run check:access`, `npm run check:cms`, `npm run check:shopping`, TypeScript and targeted ESLint, then a production build. Access tests use isolated PGlite and invoke the same repository mutations used in production. Real email delivery, browser OTP login and payment processing are not proven by these tests.

## Approval-review exception

Automatic approval review rejected the one-line address change in `src/app/api/chat/route.ts` because the existing route sends customer messages and catalogue context to api.groq.com. The narrow diff does not change that destination or payload, but review still requires explicit approval. This file is excluded from the proposed commit. The chatbot's deterministic fallback can therefore still state the old business address; the shared AI knowledge has been updated. Hold release until that remaining inconsistency is approved and corrected. No Groq behaviour has been newly enabled by these changes.

Environment-name inspection (without decrypting values) found production Resend and auth settings but no Payfast/Paygate merchant configuration or Cloudinary credentials. Email delivery and uploads are not verified by configuration presence alone.

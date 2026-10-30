# Payfast checkout (South Africa)

Customers pay on Payfast's hosted page. Our server prices the order, Payfast tells our server when it is paid, and only
that notification marks an order paid and triggers the staff fulfilment alert ([order-notifications.md](order-notifications.md)).

## Flow
1. **Checkout page** → `POST /api/checkout/payfast` with the cart lines (id + quantity), delivery method and saved address id.
   The server re-reads every price, stock level and weight from the catalogue, works out delivery from weight, records the
   Perfect Dealz price at the time of sale, and saves an `experience_records` ORDER with status `CONFIRMED`,
   `awaitingPayment: true`, `paymentVerified: false`. It returns the signed Payfast form fields; the browser posts them to Payfast.
   A double click with the same cart reuses the same order (`checkoutKey`).
2. **Payfast** takes the payment, then calls `POST /api/payfast/itn` (server to server) and sends the customer to
   `/checkout/return` (or `/checkout/cancelled`). The return page never says "paid"; it says we are confirming.
3. **Notification** is accepted only if all pass: signature valid (with passphrase), order reference and merchant match,
   amount equals our stored total, status `COMPLETE`, request comes from a Payfast address, and Payfast's own `/eng/query/validate`
   answers `VALID`. Then, inside one transaction on the locked row: `CONFIRMED` → `PAID`, `paymentVerified: true`, Payfast
   reference, fee and net recorded, `PAYMENT_VERIFIED` event. Then `notifyPaidOrderLive` emails staff. A failed email never
   fails the payment record; staff can resend via `POST /api/operations/orders/notify`.
   Replies: 200 handled, 400 rejected for good, 503 please retry.

## Switches (all environment variables)
`PAYFAST_ENABLED=true`, `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, `PAYFAST_MODE` (`sandbox` default, or `live`),
`PAYFAST_SITE_URL` (public https origin, default `https://plentovo.com`). With any missing, or live without a passphrase,
payment stays off: the pay button is hidden and the API answers 503. Also set `ORDER_ALERT_EMAIL`.
Set the same passphrase in the Payfast dashboard; a mismatch makes every signature fail.

## Before going live
* Run the whole flow in **sandbox** first (sandbox merchant id/key from Payfast's sandbox account; the ITN source check uses
  `sandbox.payfast.co.za`). Signing and verification follow Payfast's published rules but have only been tested against our own
  vectors, not against Payfast, so the sandbox run is the real proof.
* Payfast must have activated the merchant account.
* Orders left unpaid stay `CONFIRMED` with `awaitingPayment: true` (visible to staff as "confirmed"). They are not cancelled automatically yet.
* Staff can still move an order to `PAID` by hand in the operations screen; that path does not set `paymentVerified`, so it will
  not send the fulfilment alert.
* Perfect Dealz is still bought by hand from the alert; there is no supplier API.

Checks: `npm run check:orders` (signing, notification checks, server-side pricing, payment recording, alert; in-memory Postgres).

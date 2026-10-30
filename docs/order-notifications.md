# South African paid-order alert

When a South African order is **verified paid**, staff receive one email with everything needed to buy it from
Perfect Dealz: customer and delivery details, items, what was paid, margin, and a fulfilment checklist.

## Status

Built and tested. [payfast-checkout.md](payfast-checkout.md) connects it to Payfast payments (separate branch; off until enabled). Checkout and orders are still closed, and no payment provider is
integrated, so nothing calls it. The future Payfast notification handler must verify the payment, set the order to
`PAID` with `data.paymentVerified = true`, and then call `notifyPaidOrderLive(orderId)`
(`src/lib/orders/notify-live.ts`). Until then the only entry point is the staff route below.

## Pricing model it assumes

* Site item prices are already marked up from the Perfect Dealz website price (`retail()` in `src/lib/catalogue.ts`).
  That mark-up is the margin: item price paid minus supplier price.
* Delivery is a separate line, added at checkout when the customer chooses delivery. It is not margin. The email shows the
  delivery fee collected so staff can compare it with Perfect Dealz's delivery charge when they buy.
* The Payfast fee is paid out of the margin, not added as a separate customer line. Set `PAYFAST_FEE_PERCENT` and
  `PAYFAST_FEE_FIXED_CENTS` to see margin after fees; if unset the email says the rates are not configured and invents none.

## Order record it reads

The existing `experience_records` row with `kind='ORDER'`, `status` `PAID` or `FULFILMENT`, and `data.paymentVerified === true`:
`country:'ZA'`, `customerName`, `phone`, `email`, `items[{name, option, slug, quantity, unitPriceCents, supplierCostCents?}]`,
`shippingCents`, `deliveryMethod`, `deliveryAddress` (array of lines, or `deliveryAddress`/`city`/`postcode`),
and optionally `totalCents`, `paymentRef`, `paidAt`. `supplierCostCents` is the Perfect Dealz price at the time of sale; the
future checkout should record it. Orders with missing or inconsistent data are reported (`invalid_order`), never emailed with guesses.

## Behaviour

* Sent **once per order**: an `experience_events` row (`FULFILMENT_ALERT_SENT`) is the marker, written in the same
  transaction that locks the order row. A failed send writes `FULFILMENT_ALERT_FAILED` and can be retried.
* Resend email keys change per deliberate resend; crash retries reuse the key so the provider de-duplicates.
* Fails closed with `not_configured` when `ORDER_ALERT_EMAIL` (comma-separated) is empty.
* `POST /api/operations/orders/notify` `{orderId, resend?}` — staff with South Africa write access. It re-checks
  eligibility on the record and cannot mark an order paid.

## Not done

* No Payfast integration, no order creation at checkout, and nothing places supplier orders. Perfect Dealz has no known API;
  orders are still placed on their website by hand.
* The email is sent through the existing Resend sender (`FROM_EMAIL`). No schema change: it uses existing tables.

Checks: `npm run check:orders` (12 tests; uses an in-memory Postgres).

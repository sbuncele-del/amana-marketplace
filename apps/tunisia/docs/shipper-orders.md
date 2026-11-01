# Shipper order hand-off (Tunisia)

Off by default. When `TUNISIA_SHIPPER_SUBMIT=true` (and a Shipper API key is set), each new cash-on-delivery order is sent
to Shipper right after it is saved, as a **draft** (`auto_fulfill: false`) marked cash on delivery, with
`with_confirmation: true` so Shipper phones the customer before anything ships. Shipper's id and later statuses are stored
on the order row (`shipper_order_id`, `shipper_status`, `shipper_error`).

## Before switching it on (not verified)

1. **Fees and money.** Ask Shipper for the delivery fee per governorate, who collects the cash, when it is paid to us,
   and what happens on refused or returned parcels. Put the customer delivery fee in `TUNISIA_SHIPPING_FEE_TND`.
2. **Who confirms.** With the default, Shipper calls the customer. Our customer email and the staff alert say we call;
   align the wording or set `TUNISIA_SHIPPER_CONFIRMATION=false`.
3. **Product ids.** Orders use our product `id` as Shipper's product/variant UUID. Confirm with one test order that the
   products you list resolve.
4. **Governorate names.** Sent as written in our list (e.g. "Béja", "Le Kef") and must match
   `GET /countries/TN/divisions`. The delegation goes in the address line, not `division_2`. Check with the test order.
5. **Test with one order** in Shipper's dashboard before real customers: check address, phone, items, COD amount, draft.

## Turn it on

1. Shipper dashboard > Integrations > API: create a key. Vercel (`plentovo-tunisia`, Production):
   `SHIPPER_NETWORK_API_KEY`, `TUNISIA_SHIPPER_SUBMIT=true`, `TUNISIA_SHIPPING_FEE_TND`. Redeploy.
2. Status updates: choose a secret and register the webhook once:

```bash
curl -X POST https://server.shipper.network/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_API_KEY" -H "Content-Type: application/json" \
  -d '{"url":"https://plentovo.com/tunisia/api/webhooks/shipper","events":["order.status_changed","shipment.status_changed"],"secret":"YOUR_SECRET"}'
```

   Put the same secret in `TUNISIA_SHIPPER_WEBHOOK_SECRET` and redeploy. Shipper disables a webhook after 3 failed
   deliveries; delete and re-register it if that happens.

## When something goes wrong

Shipper has no duplicate protection, so a submission is claimed first and never retried automatically.

- **Refused (4xx):** stored as `rejected` with Shipper's message; staff get an email. Fix the cause and place it by hand.
- **No answer or server error:** stored as `needs_review`; staff get an email saying Shipper may already have it. Search
  Shipper by the customer's phone before placing it by hand, so it is not entered twice.

Webhook endpoint answers 503 without the secret, 400 for a bad signature, 200 otherwise. Updates apply only if newer.

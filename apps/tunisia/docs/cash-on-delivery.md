# Tunisia cash-on-delivery ordering

No online payment. A customer fills in name, Tunisian phone number, governorate, delegation and address; the server re-reads
prices and stock, saves the order (`public.plentovo_tn_orders`, created on first use) and emails the team, who **call the
customer to confirm the order and the delivery fee before anything is dispatched**. Status starts `PENDING_CONFIRMATION`.

* The browser never sets prices. Totals are items only; **the delivery fee is not invented** (Shipper's fees are unverified).
  The page and the staff email say it is confirmed on the call.
* Safe to retry: the browser's request key makes a double click, or a retry after an email failure, return the same order
  and re-send the alert only if it never went out. One phone number may place 3 orders an hour. A hidden field catches bots.
* It stays **closed (503)** unless all are set: `TUNISIA_ORDERS_ENABLED=true`, a database (`TUNISIA_DATABASE_URL`, else
  `DATABASE_URL`/`POSTGRES_URL`), `RESEND_API_KEY`, `TUNISIA_FROM_EMAIL` (a sender verified in Resend) and `TUNISIA_ORDER_ALERT_EMAIL`.
  The page shows the existing "not open yet" checkout until then.
* Nothing is sent to Shipper. Staff place confirmed orders with Shipper by hand until its order API, COD remittance terms and
  Algeria/Tunisia coverage are verified. Add the Shipper submission and an order list screen next; today staff see orders only
  in the email (and the table).

## Google indexing (separate switch)
The site was hard-coded `noindex, nofollow`. It now stays that way unless `TUNISIA_INDEXING=true`. When on, public pages are
indexable with canonical and en/fr/ar `hreflang` links; cart, checkout and tracking stay `noindex` always. The sitemap
(`/tunisia/sitemap.xml`) and the main-site `robots.txt` entry already exist. A working checkout is not what makes Google index
pages; the noindex tag was. Google Merchant Center (shopping listings) does need a working checkout, a delivery and returns policy.

## Before turning on
1. Add the env vars above in the `plentovo-tunisia` Vercel project and redeploy.
2. Place a test order on the preview, confirm the email arrives and the call-back process works.
3. Have French and Arabic checkout wording (`lib/cod-copy.ts`) read by a native speaker.
4. Then set `TUNISIA_INDEXING=true` when you want Google to start indexing.

Checks: `npm run check:tunisia-orders` (validation, phone rules, pricing, storage idempotency, rate limit, config gating, email escaping).

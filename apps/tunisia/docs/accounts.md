# Customer accounts (Tunisia)

Optional. Guests can still order. A customer signs in at `/tunisia/<locale>/account` with their email: we send a 6-digit
code (valid 10 minutes, one use, 5 tries, one new code per minute), no password. Signing in creates the account the first
time and records consent.

What an account gives a customer: their orders with a simple status (received, confirmed, on its way, delivered), saved
name, phone and address, sign out, and deleting their account. Guests without an account can look up an order with its
reference and phone number on `/track`.

## Turn it on

Vercel (`plentovo-tunisia`, Production): set `TUNISIA_ACCOUNT_SECRET` to a long random string
(`openssl rand -base64 32`), then redeploy. It also needs the existing database, `RESEND_API_KEY` and `TUNISIA_FROM_EMAIL`.
Until then the account API answers 503 and the page says accounts are not open.

## How data is handled

- Tables: `plentovo_tn_customers`, `plentovo_tn_login_codes`, `plentovo_tn_sessions` (created automatically). Codes and
  session tokens are stored only as hashes. The session cookie is HttpOnly, Secure, SameSite=Lax, 30 days.
- Orders placed with the same email are linked to the account when its owner proves the email with a code.
- Deleting an account removes the customer, sessions and codes. Past orders stay for delivery and accounting records, but
  lose the account link and the email address.
- Status shown to customers comes from the order row and Shipper's latest status (needs the Shipper hand-off switched on
  to go beyond "received").

## Not done yet

- Checkout does not yet prefill from, or attach orders to, a signed-in account (orders are linked by email after sign-in).
- Reviews and the review-request email build on this next.
- Tunisia's data-protection law (Law 2004-63, INPDP) may require registration and specific wording. Have a Tunisian adviser
  review the consent text and privacy notice. The French and Arabic wording is unchecked.

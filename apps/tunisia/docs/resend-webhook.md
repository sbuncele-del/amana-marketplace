# Resend webhook (Tunisia)

Endpoint: `https://plentovo.com/tunisia/api/webhooks/resend`

Resend calls it when an order email is delivered, bounces, is marked as spam or fails. Every request is checked against
Resend's signature and rejected if it is unsigned, altered or older than 5 minutes. Each event is stored once in
`public.plentovo_tn_mail_events` (keyed by Resend's message id, so retries are harmless). Bounces, complaints, failures
and suppressions are also written to the server log as `[tn-mail]`.

## Turn it on

1. Resend > Webhooks > Add endpoint. URL as above. Tick at least: `email.delivered`, `email.bounced`, `email.complained`,
   `email.failed`, `email.suppressed`.
2. Copy the signing secret (`whsec_...`).
3. Vercel > `plentovo-tunisia` > Environment Variables (Production): `TUNISIA_RESEND_WEBHOOK_SECRET` = that secret.
   Redeploy.
4. In Resend, press "Send test event". Expect a 200 response. Without the secret the endpoint answers 503; with a wrong
   one, 400.

## Notes

- The Resend account is shared with the main site, which has its own webhook (`/api/webhooks/resend`). Each endpoint
  gets every event for the account, so the Tunisia table also holds events for non-Tunisia mail. It is small; filter by
  `subject` or `recipients` when reading it.
- Nothing is suppressed automatically yet. There is no customer email list in Tunisia; this becomes useful when the
  customer confirmation email is added.
- Ordering does not depend on this webhook.

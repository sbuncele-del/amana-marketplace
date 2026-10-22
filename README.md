# Plentovo

South African retail storefront at https://plentovo.com, an African Shelf brand.
The repository retains its historical name `amana-marketplace`.

## Current launch stage

Browsing-only prelaunch. Online order creation is closed on the server until an approved payment integration and the complete order lifecycle are tested. Payfast is under consideration; this repository does not establish provider approval.

Do not describe legacy Flutterwave or Vesicash modules as active integrations, promise escrow protection, invent partners, or fabricate reviews. CIPC registration details and a verified branded email remain pending.

## Development

Node.js 24, Next.js 16, React 19, PostgreSQL and Prisma.

- Install: `npm ci`
- Generate database client: `npx prisma generate`
- Run locally: `npm run dev`
- Check types: `npx tsc --noEmit`
- Build: `npm run build` (runs the experience migration; use an approved database)

Configure DATABASE_URL and authentication secrets in the environment. Email delivery requires RESEND_API_KEY and a verified FROM_EMAIL; missing configuration must fail explicitly. Public email links use src/lib/site.ts.

## Releases

The audited production baseline is b4b2c166ca8d4a1e01975087cba78bdbf3830a60 on catalogue/live-stock-health-beauty. The older main branch contains obsolete branding and operating claims. Never deploy main until it has been reconciled with the approved release. Verify Vercel project, commit and production aliases before releasing.

## Pinterest feed

`/feeds/pinterest.csv` uses live supplier prices and availability and Google taxonomy IDs. Supplier refresh errors must return a retryable 503 rather than publish false out-of-stock data. Category coverage and rule specificity require validation; Pinterest ingestion is separate from generating a valid CSV.

## Social profiles

The footer links Facebook, YouTube, TikTok and Pinterest. Ownership verification and the exact Instagram URL remain outstanding. Do not infer an Instagram handle.

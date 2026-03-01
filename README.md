# 🌍 Amana — African Cross-Border Marketplace

**Amana** (meaning *trust* in Swahili) is a secure cross-border marketplace connecting African sellers with buyers worldwide. Built with escrow-first payments, verified sellers, and multi-currency support.

> Part of the [ATG Group of Companies](https://atgfin.com) ecosystem.

---

## ✨ Features

- **Buyer Protection** — Vesicash escrow holds funds until delivery is confirmed
- **Secure Payments** — Flutterwave gateway supporting cards, mobile money, bank transfers
- **Seller Verification** — KYC/business document verification with trust scores
- **Product Marketplace** — Categories, search, filtering, reviews & ratings
- **Order Tracking** — Full lifecycle from purchase to delivery
- **Seller Dashboard** — Analytics, product management, order fulfillment, settings
- **Multi-Currency** — USD, ZAR, NGN, KES, and more
- **Responsive UI** — Radix UI + Tailwind CSS, mobile-first design

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | PostgreSQL 16 + Prisma ORM |
| Auth | NextAuth v5 (credentials) |
| Payments | Flutterwave |
| Escrow | Vesicash |
| UI | Radix UI + Tailwind CSS |
| Validation | Zod |
| Deployment | Docker + Nginx (Vultr VPS) |

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Register
│   ├── (main)/          # All public pages + dashboard
│   └── api/             # REST endpoints (auth, products, orders, webhooks)
├── components/          # Reusable UI (navbar, footer, product card, auth forms)
├── lib/                 # Prisma client, auth config, payment integrations
└── middleware.ts        # Route protection
prisma/
├── schema.prisma        # Database schema
└── seed.ts              # Seed data
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16 (or use Docker)

### Local Development

```bash
# Clone
git clone https://github.com/sbuncele-del/amana-marketplace.git
cd amana-marketplace

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your database URL and API keys

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed sample data
npx prisma db seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Docker (Production)

```bash
# Set environment variables
cp .env.example .env
# Edit .env with production values

# Build and start
docker compose up -d --build

# Run database migrations
docker compose exec app npx prisma db push
docker compose exec app npx prisma db seed
```

## 🌐 Deployment (Vultr VPS)

A deployment script is included for Ubuntu 22.04+ VPS:

```bash
chmod +x deploy.sh
sudo ./deploy.sh your-domain.com
```

This installs Docker, Nginx, and configures a reverse proxy. See `deploy.sh` for full details.

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | App URL (e.g. https://your-domain.com) |
| `NEXTAUTH_SECRET` | Random secret for session encryption |
| `VESICASH_API_URL` | Vesicash API endpoint |
| `VESICASH_PUBLIC_KEY` | Vesicash public key |
| `VESICASH_PRIVATE_KEY` | Vesicash private key |
| `FLUTTERWAVE_PUBLIC_KEY` | Flutterwave public key |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave secret key |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL |

## 📄 License

Proprietary — ATG Group of Companies. All rights reserved.

// Additive, isolated commerce foundation. Money is stored in currency minor units.
export const commerceSchema = `
CREATE TABLE IF NOT EXISTS commerce_markets (
 code text PRIMARY KEY CHECK(code ~ '^[A-Z]{2}$'),name text NOT NULL,currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),locale text NOT NULL,languages jsonb NOT NULL,
 status text NOT NULL DEFAULT 'PREPARATION' CHECK(status IN ('PREPARATION','ACTIVE','SUSPENDED')),
 readiness jsonb NOT NULL DEFAULT '{"payments":false,"fulfilment":false,"returns":false,"localisation":false}',version integer NOT NULL DEFAULT 1,updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS commerce_staff (
 user_id text NOT NULL REFERENCES "User"(id),scope text NOT NULL DEFAULT '*',market_code text REFERENCES commerce_markets(code),role text NOT NULL CHECK(role IN ('MANAGER','CATALOGUE','MARKETING','FULFILMENT')),active boolean NOT NULL DEFAULT true,
 PRIMARY KEY(user_id,scope),CHECK(scope=coalesce(market_code,'*'))
);
CREATE TABLE IF NOT EXISTS commerce_partners (
 id text PRIMARY KEY,name text NOT NULL,website text NOT NULL,kind text NOT NULL CHECK(kind IN ('FULFILMENT','SELLER')),status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','SUSPENDED','REJECTED')),
 applicant_id text REFERENCES "User"(id),note text NOT NULL DEFAULT '',verification_note text,version integer NOT NULL DEFAULT 1,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS commerce_application_once ON commerce_partners(applicant_id) WHERE applicant_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS commerce_partner_markets (partner_id text REFERENCES commerce_partners(id),market_code text REFERENCES commerce_markets(code),PRIMARY KEY(partner_id,market_code));
CREATE TABLE IF NOT EXISTS commerce_partner_members (partner_id text REFERENCES commerce_partners(id),user_id text REFERENCES "User"(id),active boolean NOT NULL DEFAULT true,PRIMARY KEY(partner_id,user_id));
CREATE TABLE IF NOT EXISTS commerce_products (id text PRIMARY KEY,title text NOT NULL,google_category_id text,updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS commerce_variants (id text PRIMARY KEY,product_id text NOT NULL REFERENCES commerce_products(id),UNIQUE(id,product_id));
CREATE TABLE IF NOT EXISTS commerce_offers (
 id text PRIMARY KEY,partner_id text NOT NULL,market_code text NOT NULL,product_id text NOT NULL REFERENCES commerce_products(id),variant_id text NOT NULL REFERENCES commerce_variants(id),supplier_sku text NOT NULL,
 currency text NOT NULL CHECK(currency ~ '^[A-Z]{3}$'),cost_minor bigint NOT NULL CHECK(cost_minor>=0),price_minor bigint NOT NULL CHECK(price_minor>0),quantity integer CHECK(quantity>=0),stock_status text NOT NULL CHECK(stock_status IN ('AVAILABLE','UNAVAILABLE','UNKNOWN')),
 observed_at timestamptz NOT NULL,expires_at timestamptz NOT NULL,delivery_min_days integer NOT NULL CHECK(delivery_min_days>=0),delivery_max_days integer NOT NULL CHECK(delivery_max_days>=delivery_min_days),approved boolean NOT NULL DEFAULT false,version integer NOT NULL DEFAULT 1,updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(partner_id,market_code) REFERENCES commerce_partner_markets(partner_id,market_code),FOREIGN KEY(variant_id,product_id) REFERENCES commerce_variants(id,product_id),UNIQUE(partner_id,market_code,supplier_sku),CHECK(expires_at>observed_at),CHECK(NOT(stock_status='AVAILABLE' AND quantity=0))
);
CREATE INDEX IF NOT EXISTS commerce_offers_market ON commerce_offers(market_code,approved,expires_at);
CREATE TABLE IF NOT EXISTS commerce_sync_runs (id text PRIMARY KEY,partner_id text NOT NULL REFERENCES commerce_partners(id),market_code text NOT NULL REFERENCES commerce_markets(code),status text NOT NULL CHECK(status IN ('SUCCESS','FAILED')),processed integer NOT NULL DEFAULT 0,error_code text,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS commerce_shipments (
 id text PRIMARY KEY,request_key text NOT NULL UNIQUE,order_id text NOT NULL REFERENCES experience_records(id),partner_id text NOT NULL,market_code text NOT NULL,status text NOT NULL DEFAULT 'ASSIGNED' CHECK(status IN ('ASSIGNED','ACCEPTED','REJECTED','DISPATCHED','DELIVERED')),
 lines jsonb NOT NULL,delivery_address jsonb NOT NULL,tracking_number text,version integer NOT NULL DEFAULT 1,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(partner_id,market_code) REFERENCES commerce_partner_markets(partner_id,market_code)
);
CREATE INDEX IF NOT EXISTS commerce_shipments_partner ON commerce_shipments(partner_id,status,created_at DESC);
CREATE TABLE IF NOT EXISTS commerce_audit (id text PRIMARY KEY,actor_id text REFERENCES "User"(id),action text NOT NULL,entity_id text NOT NULL,market_code text,data jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS commerce_audit_entity ON commerce_audit(entity_id,created_at DESC);
`;

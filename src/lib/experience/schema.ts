// Additive schema for the existing PostgreSQL database. Existing commerce tables are untouched.
export const experienceSchema = `
CREATE TABLE IF NOT EXISTS experience_teams (
 id text PRIMARY KEY, name text NOT NULL, country text NOT NULL DEFAULT 'ZA',
 parent_id text REFERENCES experience_teams(id), capacity integer NOT NULL DEFAULT 40 CHECK(capacity BETWEEN 1 AND 500),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS experience_members (
 user_id text NOT NULL REFERENCES "User"(id), team_id text NOT NULL REFERENCES experience_teams(id),
 role text NOT NULL CHECK(role IN ('AGENT','LEAD','MANAGER')), active boolean NOT NULL DEFAULT true,
 PRIMARY KEY(user_id,team_id)
);
CREATE TABLE IF NOT EXISTS experience_records (
 id text PRIMARY KEY, kind text NOT NULL CHECK(kind IN ('ORDER','CASE','TASK')), reference text NOT NULL UNIQUE,
 order_id text REFERENCES experience_records(id), team_id text REFERENCES experience_teams(id),
 owner_id text REFERENCES "User"(id), status text NOT NULL, due_at timestamptz,
 data jsonb NOT NULL DEFAULT '{}', version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS experience_records_queue ON experience_records(kind,team_id,status,due_at);
CREATE INDEX IF NOT EXISTS experience_records_team_work ON experience_records(team_id,status,due_at);
CREATE INDEX IF NOT EXISTS experience_records_owner_work ON experience_records(owner_id,team_id,status);
CREATE INDEX IF NOT EXISTS experience_records_order ON experience_records(order_id);
CREATE INDEX IF NOT EXISTS experience_records_created ON experience_records(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS experience_delivery_followup ON experience_records(order_id) WHERE kind='TASK' AND data->>'taskType'='DELIVERY_CHECK_IN';
CREATE TABLE IF NOT EXISTS experience_events (
 id text PRIMARY KEY, record_id text NOT NULL REFERENCES experience_records(id), actor_id text,
 type text NOT NULL, note text NOT NULL, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS experience_events_record ON experience_events(record_id,created_at DESC);
CREATE TABLE IF NOT EXISTS experience_access_events (
 id text PRIMARY KEY, actor_id text NOT NULL, type text NOT NULL, team_id text NOT NULL,
 subject_id text, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS experience_access_events_time ON experience_access_events(created_at DESC);
CREATE INDEX IF NOT EXISTS experience_members_team ON experience_members(team_id,active,user_id);
CREATE TABLE IF NOT EXISTS experience_request_keys (
 key text PRIMARY KEY, request_hash text NOT NULL, record_id text NOT NULL REFERENCES experience_records(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS experience_rate_limits (
 key text PRIMARY KEY, hits integer NOT NULL DEFAULT 1, expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS experience_rate_limit_expiry ON experience_rate_limits(expires_at);
CREATE TABLE IF NOT EXISTS marketing_subscribers (
 id text PRIMARY KEY, email text NOT NULL UNIQUE,
 status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','ACTIVE','UNSUBSCRIBED','BOUNCED','COMPLAINED')),
 source text NOT NULL DEFAULT 'website', token text NOT NULL UNIQUE,
 consent_text text, consent_ip_hash text, consented_at timestamptz,
 confirmation_sent_at timestamptz, confirmed_at timestamptz, unsubscribed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS marketing_subscribers_status ON marketing_subscribers(status,created_at DESC);
ALTER TABLE marketing_subscribers ADD COLUMN IF NOT EXISTS market_code text CHECK(market_code IS NULL OR market_code ~ '^[A-Z]{2}$');
CREATE TABLE IF NOT EXISTS marketing_campaigns (
 id text PRIMARY KEY, name text NOT NULL, subject text NOT NULL, preheader text NOT NULL DEFAULT '',
 body text NOT NULL, cta_label text, cta_url text,
 status text NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','SENDING','SENT','FAILED')),
 recipients integer NOT NULL DEFAULT 0, delivered integer NOT NULL DEFAULT 0, failed integer NOT NULL DEFAULT 0,
 created_by text, created_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz
);
CREATE TABLE IF NOT EXISTS marketing_campaign_recipients (
 campaign_id text NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
 subscriber_id text NOT NULL REFERENCES marketing_subscribers(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'QUEUED' CHECK(status IN ('QUEUED','SENT','FAILED')),
 provider_id text, sent_at timestamptz, PRIMARY KEY(campaign_id,subscriber_id)
);
INSERT INTO experience_teams(id,name,country,capacity) VALUES('za-customer-care','South Africa · Customer Care','ZA',40) ON CONFLICT(id) DO NOTHING;

CREATE TABLE IF NOT EXISTS catalogue_reviews (
 id text PRIMARY KEY, slug text NOT NULL, user_id text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
 rating integer NOT NULL CHECK(rating BETWEEN 1 AND 5), comment text NOT NULL,
 verified boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(slug,user_id)
);
CREATE INDEX IF NOT EXISTS catalogue_reviews_slug ON catalogue_reviews(slug,created_at DESC);
`;

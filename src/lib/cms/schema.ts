export const cmsSchema = `
CREATE TABLE IF NOT EXISTS cms_documents (
 kind text NOT NULL CHECK(kind IN ('product','storefront')), key text NOT NULL,
 draft jsonb NOT NULL, version integer NOT NULL DEFAULT 1 CHECK(version>0),
 updated_by text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(kind,key)
);
CREATE TABLE IF NOT EXISTS cms_releases (
 id text PRIMARY KEY, kind text NOT NULL, key text NOT NULL, payload jsonb NOT NULL,
 starts_at timestamptz NOT NULL, ends_at timestamptz,
 cancelled_at timestamptz, created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 source_version integer NOT NULL,
 CHECK(ends_at IS NULL OR ends_at>starts_at),
 FOREIGN KEY(kind,key) REFERENCES cms_documents(kind,key)
);
CREATE INDEX IF NOT EXISTS cms_releases_active ON cms_releases(kind,key,starts_at DESC,created_at DESC) WHERE cancelled_at IS NULL;
CREATE TABLE IF NOT EXISTS cms_history (
 id text PRIMARY KEY, kind text NOT NULL, key text NOT NULL, action text NOT NULL,
 actor_id text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cms_history_document ON cms_history(kind,key,created_at DESC);
`;

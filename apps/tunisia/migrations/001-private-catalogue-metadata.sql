-- Server-only supplier metadata. No anonymous or browser database access is granted.
CREATE TABLE IF NOT EXISTS public.plentovo_tn_catalogue_metadata (
 name text PRIMARY KEY CHECK (name IN ('bindings','content')),
 payload jsonb NOT NULL CHECK (jsonb_typeof(payload)='array'),
 updated_at timestamptz NOT NULL DEFAULT now()
);

-- Visual-review sample; never used by production catalogue or order submission.
CREATE TABLE IF NOT EXISTS public.plentovo_tn_storefront_preview (
 name text PRIMARY KEY,
 payload jsonb NOT NULL CHECK (jsonb_typeof(payload)='array'),
 captured_at timestamptz NOT NULL DEFAULT now()
);

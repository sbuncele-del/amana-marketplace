export const accessSchema = `
CREATE TABLE IF NOT EXISTS auth_email_codes(id text PRIMARY KEY,email text NOT NULL,code_hash text NOT NULL,attempts integer NOT NULL DEFAULT 0,expires_at timestamptz NOT NULL,used_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),marketing_consent boolean NOT NULL DEFAULT false);
CREATE INDEX IF NOT EXISTS auth_email_codes_email ON auth_email_codes(email,created_at DESC);
CREATE TABLE IF NOT EXISTS auth_email_limits(key text PRIMARY KEY,hits integer NOT NULL,expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS customer_wishlist(user_id text NOT NULL REFERENCES "User"(id),slug text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,slug));
`;

// Minimal database seam so the same SQL runs on node-postgres in production and
// on in-memory Postgres (PGlite) in tests.
export type Db = {
 query<T = Record<string, any>>(sql: string, params?: unknown[]): Promise<{rows: T[]}>;
 exec(sql: string): Promise<void>; // multi-statement scripts (schema); no parameters
 tx<T>(fn: (db: Db) => Promise<T>): Promise<T>;
};
export const schemaSql = `
CREATE TABLE IF NOT EXISTS tn_content (
 source_product_id text PRIMARY KEY,
 source_name text NOT NULL,
 source_url text,
 slug text NOT NULL UNIQUE,
 category text NOT NULL,
 title jsonb NOT NULL,
 description jsonb NOT NULL,
 images jsonb NOT NULL,
 provenance jsonb NOT NULL,
 review_state text NOT NULL DEFAULT 'approved',
 rights text,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tn_content_name_idx ON tn_content (source_name);
CREATE TABLE IF NOT EXISTS tn_products (
 uuid text PRIMARY KEY,
 sku text,
 name text NOT NULL,
 supplier_identifier text,
 link text,
 status text NOT NULL,
 content_id text REFERENCES tn_content (source_product_id) ON DELETE SET NULL,
 match_method text NOT NULL DEFAULT 'none',
 slug text NOT NULL UNIQUE,
 last_seen_run bigint,
 missing boolean NOT NULL DEFAULT false,
 first_seen_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS tn_items (
 uuid text PRIMARY KEY,
 product_uuid text NOT NULL REFERENCES tn_products (uuid) ON DELETE CASCADE,
 variant_uuid text,
 slug text NOT NULL UNIQUE,
 label text,
 sku text,
 account_price_millimes integer,
 recommended_price_millimes integer,
 cost_millimes integer,
 price_millimes integer,
 price_basis text,
 stock integer,
 data_errors jsonb NOT NULL DEFAULT '[]',
 state text NOT NULL,
 reasons jsonb NOT NULL DEFAULT '[]',
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tn_items_state_idx ON tn_items (state);
CREATE INDEX IF NOT EXISTS tn_items_product_idx ON tn_items (product_uuid);
CREATE TABLE IF NOT EXISTS tn_import_runs (
 id bigserial PRIMARY KEY,
 status text NOT NULL,
 trigger text NOT NULL,
 per_page integer NOT NULL,
 next_page integer NOT NULL DEFAULT 1,
 last_page integer,
 total_reported integer,
 discovered integer NOT NULL DEFAULT 0,
 failed integer NOT NULL DEFAULT 0,
 error text,
 lease_until timestamptz,
 started_at timestamptz NOT NULL DEFAULT now(),
 finished_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS tn_import_one_running ON tn_import_runs ((true)) WHERE status = 'running';
CREATE TABLE IF NOT EXISTS tn_import_failures (
 id bigserial PRIMARY KEY,
 run_id bigint,
 product_uuid text,
 stage text NOT NULL,
 reason text NOT NULL,
 detail text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tn_import_failures_run_idx ON tn_import_failures (run_id);
`;
export async function createPgDb(connectionString: string): Promise<Db> {
 const {Pool} = await import('pg');
 // Small pool: serverless instances multiply, so keep per-instance connections low.
 const max = Math.min(10, Math.max(1, Number(process.env.TUNISIA_DB_POOL_MAX) || 3));
 const pool = new Pool({connectionString, max, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000});
 const wrap = (q: {query: (sql: string, params?: unknown[]) => Promise<{rows: any[]}>}): Db => ({
  query: (sql, params) => q.query(sql, params as unknown[]) as any,
  exec: async sql => { await q.query(sql); },
  tx: async () => { throw new Error('nested transaction'); },
 });
 return {
  query: (sql, params) => pool.query(sql, params as unknown[]) as any,
  exec: async sql => { await pool.query(sql); },
  async tx(fn) {
   const client = await pool.connect();
   try {
    await client.query('BEGIN');
    const out = await fn(wrap(client));
    await client.query('COMMIT');
    return out;
   } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
   } finally { client.release(); }
  },
 };
}
export function wrapPglite(pg: {query: (sql: string, params?: unknown[]) => Promise<{rows: any[]}>; exec: (sql: string) => Promise<unknown>; transaction: <T>(fn: (tx: any) => Promise<T>) => Promise<T>}): Db {
 const wrap = (q: {query: (sql: string, params?: unknown[]) => Promise<{rows: any[]}>; exec?: (sql: string) => Promise<unknown>}): Db => ({
  query: (sql, params) => q.query(sql, params as unknown[]) as any,
  exec: async sql => { await (q.exec ? q.exec(sql) : q.query(sql)); },
  tx: async () => { throw new Error('nested transaction'); },
 });
 return {query: (sql, params) => pg.query(sql, params as unknown[]) as any, exec: async sql => { await pg.exec(sql); }, tx: fn => pg.transaction(tx => fn(wrap(tx)))};
}

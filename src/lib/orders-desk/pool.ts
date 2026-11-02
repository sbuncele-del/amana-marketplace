import "server-only";
import { Pool } from "pg";
import { deskSchema } from "./store";

// Orders live wherever the Tunisia storefront writes them, which is the same database unless TUNISIA_DATABASE_URL is set.
let pool: Pool | undefined;
let ready: Promise<unknown> | undefined;
export async function deskPool() {
  const url = process.env.TUNISIA_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw new Error("ORDERS_DATABASE_NOT_CONFIGURED");
  pool ??= new Pool({ connectionString: url, max: 3, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000 });
  await (ready ??= pool.query(deskSchema).catch((e) => {
    ready = undefined;
    throw e;
  }));
  return pool;
}

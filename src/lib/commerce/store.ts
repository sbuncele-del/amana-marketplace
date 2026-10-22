import "server-only";
import type { PoolClient } from "pg";
import { randomUUID } from "node:crypto";
import { experiencePool, ensureExperienceSchema } from "@/lib/experience/store";
import { commerceSchema } from "./schema";
let ready: Promise<void> | undefined;
export async function ensureCommerce() {
  return (ready ??= (async () => {
    await ensureExperienceSchema();
    const c = await experiencePool().connect();
    try {
      await c.query("BEGIN");
      await c.query("SELECT pg_advisory_xact_lock(792046322)");
      await c.query(commerceSchema);
      await c.query(
        `INSERT INTO commerce_markets(code,name,currency,locale,languages,status) VALUES('ZA','South Africa','ZAR','en-ZA','["en-ZA"]','ACTIVE') ON CONFLICT DO NOTHING`,
      );
      await c.query("COMMIT");
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
  })().catch((e) => {
    ready = undefined;
    throw e;
  }));
}
export async function commerceTransaction<T>(
  work: (c: PoolClient) => Promise<T>,
) {
  await ensureCommerce();
  const c = await experiencePool().connect();
  try {
    await c.query("BEGIN");
    const value = await work(c);
    await c.query("COMMIT");
    return value;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
export async function audit(
  c: PoolClient,
  actor: string,
  action: string,
  id: string,
  market: string | null,
  data: Record<string, unknown> = {},
) {
  await c.query(
    "INSERT INTO commerce_audit(id,actor_id,action,entity_id,market_code,data) VALUES($1,$2,$3,$4,$5,$6)",
    [randomUUID(), actor, action, id, market, JSON.stringify(data)],
  );
}

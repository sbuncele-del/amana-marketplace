import type { PoolClient } from "pg";
import { randomUUID } from "node:crypto";
import {
  productSchema,
  storeSchema,
  validateSchedule,
  CmsError,
  type CmsKind,
} from "./domain";
export async function saveCmsWithClient(
  c: PoolClient,
  actor: string,
  kind: CmsKind,
  key: string,
  payload: unknown,
  expected: number,
) {
  // Serialise first drafts too; FOR UPDATE alone cannot lock an absent row.
  await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
    `cms:${kind}:${key}`,
  ]);
  const old = (
    await c.query(
      "SELECT version FROM cms_documents WHERE kind=$1 AND key=$2 FOR UPDATE",
      [kind, key],
    )
  ).rows[0];
  if ((old?.version || 0) !== expected)
    throw new CmsError(
      409,
      "Another colleague changed this draft. Reload before saving.",
    );
  const data =
    kind === "product"
      ? productSchema.parse(payload)
      : storeSchema.parse(payload);
  const row = (
    await c.query(
      `INSERT INTO cms_documents(kind,key,draft,version,updated_by) VALUES($1,$2,$3,1,$4) ON CONFLICT(kind,key) DO UPDATE SET draft=$3,version=cms_documents.version+1,updated_by=$4,updated_at=now() RETURNING *`,
      [kind, key, JSON.stringify(data), actor],
    )
  ).rows[0];
  await c.query(
    "INSERT INTO cms_history(id,kind,key,action,actor_id,payload) VALUES($1,$2,$3,$4,$5,$6)",
    [
      randomUUID(),
      kind,
      key,
      "DRAFT_SAVED",
      actor,
      JSON.stringify({ version: row.version, payload: data }),
    ],
  );
  return row;
}
export async function releaseCmsWithClient(
  c: PoolClient,
  actor: string,
  kind: CmsKind,
  key: string,
  version: number,
  start: string | null,
  end: string | null,
  restore?: string,
) {
  const { from, until } = validateSchedule(start, end);
  await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
    `cms:${kind}:${key}`,
  ]);
  const doc = (
    await c.query(
      "SELECT * FROM cms_documents WHERE kind=$1 AND key=$2 FOR UPDATE",
      [kind, key],
    )
  ).rows[0];
  if (!doc || doc.version !== version)
    throw new CmsError(409, "Draft changed. Reload before publishing.");
  let payload = doc.draft;
  if (restore) {
    const previous = (
      await c.query(
        "SELECT payload FROM cms_releases WHERE id=$1 AND kind=$2 AND key=$3",
        [restore, kind, key],
      )
    ).rows[0];
    if (!previous) throw new CmsError(404, "Previous release not found.");
    payload = previous.payload;
  }
  payload =
    kind === "product"
      ? productSchema.parse(payload)
      : storeSchema.parse(payload);
  const id = randomUUID();
  await c.query(
    "INSERT INTO cms_releases(id,kind,key,payload,starts_at,ends_at,created_by,source_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
    [id, kind, key, JSON.stringify(payload), from, until, actor, version],
  );
  // Publishing consumes the draft version, so duplicate/concurrent releases conflict.
  await c.query(
    "UPDATE cms_documents SET version=version+1,draft=$4,updated_by=$3,updated_at=now() WHERE kind=$1 AND key=$2",
    [kind, key, actor, JSON.stringify(payload)],
  );
  await c.query(
    "INSERT INTO cms_history(id,kind,key,action,actor_id,payload) VALUES($1,$2,$3,$4,$5,$6)",
    [
      randomUUID(),
      kind,
      key,
      restore ? "RESTORED" : "PUBLISHED",
      actor,
      JSON.stringify({ release: id, from, until, payload }),
    ],
  );
  return { id };
}
export async function cancelCmsWithClient(
  c: PoolClient,
  actor: string,
  kind: CmsKind,
  key: string,
  release: string,
) {
  const result = await c.query(
    "UPDATE cms_releases SET cancelled_at=now() WHERE id=$1 AND kind=$2 AND key=$3 AND cancelled_at IS NULL RETURNING id",
    [release, kind, key],
  );
  if (!result.rowCount)
    throw new CmsError(409, "This release is already cancelled or missing.");
  await c.query(
    "INSERT INTO cms_history(id,kind,key,action,actor_id,payload) VALUES($1,$2,$3,$4,$5,$6)",
    [
      randomUUID(),
      kind,
      key,
      "RELEASE_CANCELLED",
      actor,
      JSON.stringify({ release }),
    ],
  );
}

export const liveReleaseSql = `SELECT DISTINCT ON(kind,key) kind,key,payload FROM cms_releases WHERE cancelled_at IS NULL AND starts_at<=$1 AND (ends_at IS NULL OR ends_at>$1) ORDER BY kind,key,starts_at DESC,created_at DESC,id DESC`;

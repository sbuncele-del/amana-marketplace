import type { PoolClient } from "pg";
import { randomUUID } from "node:crypto";
import { codeHash, sameHash, normalizeEmail } from "./domain";
export async function issueCode(
  c: PoolClient,
  input: {
    id: string;
    email: string;
    hash: string;
    ipKey: string;
    consent: boolean;
  },
) {
  const email = normalizeEmail(input.email);
  await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
    "email-code:" + email,
  ]);
  for (const key of ["email:" + email, "ip:" + input.ipKey]) {
    const count = (
      await c.query(
        "INSERT INTO auth_email_limits(key,hits,expires_at) VALUES($1,1,now()+interval '1 hour') ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN auth_email_limits.expires_at<now() THEN 1 ELSE auth_email_limits.hits+1 END,expires_at=CASE WHEN auth_email_limits.expires_at<now() THEN now()+interval '1 hour' ELSE auth_email_limits.expires_at END RETURNING hits",
        [key],
      )
    ).rows[0];
    if (count.hits > (key.startsWith("email:") ? 6 : 20)) return false;
  }
  const recent = await c.query(
    "SELECT 1 FROM auth_email_codes WHERE email=$1 AND created_at>now()-interval '60 seconds' LIMIT 1",
    [email],
  );
  if (recent.rows.length) return false;
  await c.query(
    "UPDATE auth_email_codes SET used_at=now() WHERE email=$1 AND used_at IS NULL",
    [email],
  );
  await c.query(
    "INSERT INTO auth_email_codes(id,email,code_hash,expires_at,marketing_consent) VALUES($1,$2,$3,now()+interval '10 minutes',$4)",
    [input.id, email, input.hash, input.consent],
  );
  await c.query(
    "DELETE FROM auth_email_codes WHERE expires_at<now()-interval '1 day'",
  );
  await c.query(
    "DELETE FROM auth_email_limits WHERE expires_at<now()-interval '1 day'",
  );
  return true;
}
export async function consumeCode(
  c: PoolClient,
  input: {
    id: string;
    email: string;
    code: string;
    secret: string;
    passwordHash: string;
  },
) {
  const email = normalizeEmail(input.email);
  const row = (
    await c.query(
      "SELECT * FROM auth_email_codes WHERE id=$1 AND email=$2 FOR UPDATE",
      [input.id, email],
    )
  ).rows[0];
  if (
    !row ||
    row.used_at ||
    row.attempts >= 5 ||
    new Date(row.expires_at) <= new Date()
  )
    return null;
  await c.query("UPDATE auth_email_codes SET attempts=attempts+1 WHERE id=$1", [
    input.id,
  ]);
  if (
    !sameHash(
      row.code_hash,
      codeHash(input.secret, input.id, email, input.code),
    )
  )
    return null;
  const existing = (
    await c.query('SELECT id,"isActive" FROM "User" WHERE email=$1', [email])
  ).rows[0];
  if (existing && !existing.isActive) return null;
  // Verification never changes an existing role or grants staff/partner access.
  const user = (
    await c.query(
      `INSERT INTO "User"(id,name,email,"passwordHash","firstName","lastName",country,role,"isActive","emailVerified","updatedAt") VALUES($1,'', $2,$3,'','','South Africa','BUYER',true,true,now()) ON CONFLICT(email) DO UPDATE SET "emailVerified"=true RETURNING id,"isActive"`,
      [randomUUID(), email, input.passwordHash],
    )
  ).rows[0];
  if (!user.isActive) return null;
  await c.query("UPDATE auth_email_codes SET used_at=now() WHERE id=$1", [
    input.id,
  ]);
  return { id: user.id, email, marketingConsent: row.marketing_consent };
}

import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import type { PoolClient } from "pg";
import { accessSchema } from "../src/lib/access/schema";
import { issueCode, consumeCode } from "../src/lib/access/repository";
import {
  codeHash,
  normalizeEmail,
  safeReturnPath,
  sameHash,
} from "../src/lib/access/domain";
import {
  cleanImages,
  cleanSupplierText,
  qualityFlags,
} from "../src/lib/catalogue-quality";
async function main() {
  const db = new PGlite();
  await db.exec(
    `CREATE TABLE "User"(id text PRIMARY KEY,name text NOT NULL,email text UNIQUE NOT NULL,"passwordHash" text NOT NULL,"firstName" text NOT NULL,"lastName" text NOT NULL,country text NOT NULL,role text NOT NULL,"isActive" boolean NOT NULL,"emailVerified" boolean NOT NULL,"updatedAt" timestamptz NOT NULL);CREATE FUNCTION pg_advisory_xact_lock(integer) RETURNS void LANGUAGE SQL AS $$ SELECT $$;`,
  );
  await db.exec(accessSchema);
  await db.exec(accessSchema);
  let executor: { query: typeof db.query } = db;
  const c = {
    query: async (sql: string, args?: unknown[]) => {
      const r = await executor.query(sql, args);
      return { ...r, rowCount: r.affectedRows };
    },
  } as unknown as PoolClient;
  const tx = <T>(fn: () => Promise<T>) =>
    db.transaction(async (t) => {
      executor = t;
      try {
        return await fn();
      } finally {
        executor = db;
      }
    });
  const secret = "test-only-long-secret",
    email = "owner@example.test",
    id = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
    code = "123456";
  const request = {
    id,
    email,
    hash: codeHash(secret, id, email, code),
    ipKey: "ip-test",
    consent: false,
  };
  assert.equal(normalizeEmail(" OWNER@EXAMPLE.TEST "), email);
  assert.equal(sameHash("z".repeat(64), "0".repeat(64)), false);
  assert.equal(
    codeHash(secret, id, email, code),
    codeHash(secret, id, " OWNER@EXAMPLE.TEST ", code),
  );
  for (const path of [
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/login",
    "/api/auth/callback",
  ])
    assert.equal(safeReturnPath(path), null);
  assert.equal(
    safeReturnPath("/operations/store?tab=products"),
    "/operations/store?tab=products",
  );
  assert.equal(await tx(() => issueCode(c, request)), true);
  assert.equal(
    await tx(() => issueCode(c, { ...request, id: "second" })),
    false,
    "Resend cooldown",
  );
  const input = {
    email,
    id,
    code,
    secret,
    passwordHash: "random-unusable-password-hash",
  };
  assert.equal(
    await tx(() => consumeCode(c, { ...input, code: "000000" })),
    null,
  );
  const account = await tx(() => consumeCode(c, input));
  assert.ok(account);
  assert.equal(await tx(() => consumeCode(c, input)), null, "Single-use code");
  const user = (
    await db.query<{ role: string; emailVerified: boolean }>(
      'SELECT role,"emailVerified" FROM "User"',
    )
  ).rows[0];
  assert.equal(user.role, "BUYER");
  assert.equal(user.emailVerified, true);
  await db.query(`UPDATE "User" SET role='ADMIN' WHERE email=$1`, [email]);
  await db.exec(
    "UPDATE auth_email_codes SET created_at=now()-interval '2 minutes'",
  );
  const id2 = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
  assert.equal(
    await tx(() =>
      issueCode(c, {
        ...request,
        id: id2,
        hash: codeHash(secret, id2, email, code),
      }),
    ),
    true,
  );
  await tx(() => consumeCode(c, { ...input, id: id2 }));
  assert.equal(
    (await db.query<{ role: string }>('SELECT role FROM "User"')).rows[0].role,
    "ADMIN",
    "Existing staff role must remain unchanged",
  );
  await db.exec(
    "UPDATE auth_email_codes SET created_at=now()-interval '2 minutes'",
  );
  const id3 = "cccccccc-cccc-4ccc-cccc-cccccccccccc";
  await tx(() =>
    issueCode(c, {
      ...request,
      id: id3,
      hash: codeHash(secret, id3, email, code),
    }),
  );
  for (let i = 0; i < 5; i++)
    assert.equal(
      await tx(() => consumeCode(c, { ...input, id: id3, code: "999999" })),
      null,
    );
  assert.equal(
    await tx(() => consumeCode(c, { ...input, id: id3 })),
    null,
    "Attempt limit",
  );
  await db.exec(
    "UPDATE auth_email_codes SET created_at=now()-interval '2 minutes'",
  );
  const id4 = "dddddddd-dddd-4ddd-dddd-dddddddddddd";
  await tx(() =>
    issueCode(c, {
      ...request,
      id: id4,
      hash: codeHash(secret, id4, email, code),
    }),
  );
  await db.query(
    "UPDATE auth_email_codes SET expires_at=now()-interval '1 minute' WHERE id=$1",
    [id4],
  );
  assert.equal(
    await tx(() => consumeCode(c, { ...input, id: id4 })),
    null,
    "Expired code",
  );
  await db.query(
    `INSERT INTO customer_wishlist(user_id,slug) VALUES($1,'chair'),($1,'table')`,
    [account!.id],
  );
  await db.query("DELETE FROM customer_wishlist WHERE user_id=$1 AND slug=$2", [
    account!.id,
    "chair",
  ]);
  assert.equal(
    (await db.query("SELECT * FROM customer_wishlist")).rows.length,
    1,
  );
  const claim =
    "Monitor your blood pressure with confidence. Helps eczema relief.";
  assert.equal(
    cleanSupplierText(claim),
    claim,
    "Do not manufacture or rewrite supplier claims",
  );
  assert.ok(
    qualityFlags({
      name: "Monitor",
      description: claim,
      images: ["", "https://cdn.test/a.jpg"],
    }).some((f) => f.includes("review")),
  );
  assert.deepEqual(
    cleanImages([
      "",
      "https://cdn.test/a.jpg?v=1",
      "https://cdn.test/a.jpg?v=2",
      "javascript:alert(1)",
    ]),
    ["https://cdn.test/a.jpg?v=1"],
  );
  await db.exec(
    "UPDATE auth_email_codes SET created_at=now()-interval '2 minutes'",
  );
  await db.query('UPDATE "User" SET "isActive"=false WHERE email=$1', [email]);
  const inactive = "eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee";
  assert.equal(
    await tx(() =>
      issueCode(c, {
        ...request,
        id: inactive,
        hash: codeHash(secret, inactive, email, code),
      }),
    ),
    true,
  );
  assert.equal(
    await tx(() => consumeCode(c, { ...input, id: inactive })),
    null,
    "Inactive account cannot sign in",
  );
  for (let i = 0; i < 21; i++) {
    const other = "rate-" + i;
    const mail = `rate${i}@example.test`;
    assert.equal(
      await tx(() =>
        issueCode(c, {
          id: other,
          email: mail,
          hash: codeHash(secret, other, mail, code),
          ipKey: "isolated-ip-limit",
          consent: false,
        }),
      ),
      i < 20,
      "IP rate limit",
    );
  }
  await db.close();
  console.log(
    "Access checks passed: normalization, return URLs, cooldown, expiry, attempt limit, single use, buyer creation, role preservation, wishlist and supplier-claim preservation.",
  );
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import "server-only";
import { createHmac, randomInt, randomUUID, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { transaction } from "@/lib/experience/store";
import { accessSchema } from "./schema";
import { codeHash, normalizeEmail } from "./domain";
import { issueCode, consumeCode } from "./repository";
import { sendMail, mailConfigured } from "@/lib/mail/send";
import {layout} from '@/lib/mail/layout';
import { requestSubscription } from "@/lib/mail/subscribers";
let ready: Promise<void> | undefined;
export function ensureAccess() {
  return (ready ??= transaction(async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(792046324)");
    await c.query(accessSchema);
  }).catch((e) => {
    ready = undefined;
    throw e;
  }));
}
function secret() {
  const key = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!key) throw Error("AUTH_NOT_CONFIGURED");
  return key;
}
export async function requestCode(email: string, ip: string, consent: boolean) {
  if (!mailConfigured()) throw Error("MAIL_NOT_CONFIGURED");
  const key = secret(),
    id = randomUUID(),
    code = String(randomInt(0, 1000000)).padStart(6, "0");
  await ensureAccess();
  const accepted = await transaction((c) =>
    issueCode(c, {
      id,
      email: normalizeEmail(email),
      hash: codeHash(key, id, email, code),
      ipKey: createHmac("sha256", key).update(ip).digest("hex"),
      consent,
    }),
  );
  if (!accepted) throw Error("RATE_LIMIT");
  try {
    await sendMail({
      to: email,
      subject: "Your Plentovo sign-in code",
      html: layout({preheader:"Your secure Plentovo sign-in code",content:`<h1>Sign in to Plentovo</h1><p>Your one-time code is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes. Do not share it. If you did not request it, you can ignore this email.</p>`}),
      idempotencyKey: "login-" + id,
    });
  } catch (e) {
    await transaction((c) =>
      c.query("UPDATE auth_email_codes SET used_at=now() WHERE id=$1", [id]),
    );
    throw e;
  }
  return id;
}
export async function verifyCode(email: string, id: string, code: string) {
  if (!/^[0-9]{6}$/.test(code) || !/^[-a-f0-9]{36}$/.test(id)) return null;
  await ensureAccess();
  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
  const result = await transaction((c) =>
    consumeCode(c, { email, id, code, secret: secret(), passwordHash }),
  );
  if (result?.marketingConsent)
    await requestSubscription(
      result.email,
      "registration",
      "email-code",
      "ZA",
      true,
    ).catch(() => {});
  return result;
}

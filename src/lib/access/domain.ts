import { createHmac, timingSafeEqual } from "node:crypto";
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export function codeHash(
  secret: string,
  id: string,
  email: string,
  code: string,
) {
  return createHmac("sha256", secret)
    .update(`${id}:${normalizeEmail(email)}:${code}`)
    .digest("hex");
}
export function sameHash(a: string, b: string) {
  return (
    /^[a-f0-9]{64}$/.test(a) &&
    /^[a-f0-9]{64}$/.test(b) &&
    timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"))
  );
}
export function safeReturnPath(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^\/(?!\/)/.test(value) ||
    /[\\\x00-\x1f]/.test(value)
  )
    return null;
  try {
    const u = new URL(value, "https://plentovo.com");
    if (
      u.origin !== "https://plentovo.com" ||
      /^\/(login|register|api\/auth)(\/|$)/.test(u.pathname)
    )
      return null;
    return u.pathname + u.search + u.hash;
  } catch {
    return null;
  }
}

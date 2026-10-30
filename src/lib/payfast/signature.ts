// Payfast request signing, per Payfast's custom-integration rules: fields are signed in the order they are
// sent (never sorted), values are URL-encoded the way PHP urlencode() does (space as +, uppercase hex), the
// passphrase is appended last, and the digest is a lowercase MD5. Pure; no I/O.
import {createHash, timingSafeEqual} from 'node:crypto';

export type Pairs = [string, string][];

export const encode = (value: string) =>
  encodeURIComponent(value).replace(/%20/g, '+').replace(/[!'()*~]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

export function paramString(pairs: Pairs, opts: {skipEmpty: boolean}) {
  return pairs.filter(([, v]) => !opts.skipEmpty || v !== '').map(([k, v]) => `${k}=${encode(v)}`).join('&');
}

export function sign(pairs: Pairs, passphrase: string, opts: {skipEmpty: boolean}) {
  const base = paramString(pairs, opts);
  const full = passphrase ? `${base}&passphrase=${encode(passphrase)}` : base;
  return createHash('md5').update(full).digest('hex');
}

/** Checkout form fields: empty values are dropped, then the signature is added last. */
export function signedCheckout(pairs: Pairs, passphrase: string): Pairs {
  const clean = pairs.map(([k, v]): [string, string] => [k, v.trim()]).filter(([, v]) => v !== '');
  return [...clean, ['signature', sign(clean, passphrase, {skipEmpty: true})]];
}

/** Reads a posted form body keeping the order Payfast sent the fields in. */
export const parseBody = (raw: string): Pairs => [...new URLSearchParams(raw).entries()];

/** Notification signature: every field except `signature`, in posted order, empty values included. */
export function notificationSignatureValid(pairs: Pairs, passphrase: string) {
  const given = pairs.find(([k]) => k === 'signature')?.[1] ?? '';
  const expected = sign(pairs.filter(([k]) => k !== 'signature'), passphrase, {skipEmpty: false});
  const a = Buffer.from(given.toLowerCase()), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

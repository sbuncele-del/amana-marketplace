import {timingSafeEqual} from 'node:crypto';
// Fails closed: no configured secret means nobody is authorised.
export function bearerMatches(header: string | null, secret: string | undefined): boolean {
 if (!secret || secret.length < 16 || !header?.startsWith('Bearer ')) return false;
 const given = Buffer.from(header.slice(7)), expected = Buffer.from(secret);
 return given.length === expected.length && timingSafeEqual(given, expected);
}
export function parseIds(raw: string | null, max = 50): string[] | null {
 if (!raw) return [];
 const ids = raw.split(',');
 if (ids.length > max || ids.some(id => !/^[a-zA-Z0-9-]{1,64}$/.test(id))) return null;
 return [...new Set(ids)];
}

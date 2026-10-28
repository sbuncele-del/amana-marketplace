import type {Translation} from '../catalogue';
import {locales} from '../catalogue';
export type Provenance = 'supplier' | 'curated' | 'human' | 'machine';
export type ContentRecord = {
 sourceProductId: string; sourceName: string; sourceUrl: string | null; slug: string; category: string;
 title: Translation; description: Translation; images: string[];
 provenance: Record<'en' | 'fr' | 'ar', Provenance>; reviewState: 'approved' | 'needs_review'; rights: string | null;
};
const provenances: Provenance[] = ['supplier', 'curated', 'human', 'machine'];
const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
export function slugify(value: string) {
 return value.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}
export const shortId = (uuid: string) => uuid.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
export function imageAllowed(url: unknown, hosts: string[]) {
 if (typeof url !== 'string') return false;
 try { const u = new URL(url); return u.protocol === 'https:' && hosts.includes(u.hostname.toLowerCase()); } catch { return false; }
}
// Validates one supplier-content row. Incomplete translations are allowed here
// (they are reported as pending); structurally invalid rows are rejected.
export function parseContent(input: unknown): {ok: true; value: ContentRecord} | {ok: false; reason: string} {
 const r = (input && typeof input === 'object' ? input : {}) as Record<string, any>;
 const id = text(r.sourceProductId), name = text(r.sourceName);
 if (!/^[a-zA-Z0-9-]+$/.test(id)) return {ok: false, reason: 'invalid sourceProductId'};
 if (!name) return {ok: false, reason: 'missing sourceName'};
 const slug = text(r.slug);
 if (!/^[a-z0-9-]+$/.test(slug)) return {ok: false, reason: 'invalid slug'};
 if (!text(r.category)) return {ok: false, reason: 'missing category'};
 const pick = (key: 'title' | 'description') => Object.fromEntries(locales.map(l => [l, text(r[key]?.[l])])) as Translation;
 const images = Array.isArray(r.images) ? r.images.filter((i: unknown): i is string => typeof i === 'string') : [];
 const provenance = Object.fromEntries(locales.map(l => {
  const p = r.provenance?.[l];
  return [l, provenances.includes(p) ? p : 'curated'];
 })) as ContentRecord['provenance'];
 const reviewState = r.reviewState === 'needs_review' ? 'needs_review' : 'approved';
 return {ok: true, value: {sourceProductId: id, sourceName: name, sourceUrl: text(r.sourceUrl) || null, slug, category: text(r.category), title: pick('title'), description: pick('description'), images, provenance, reviewState, rights: text(r.rights) || null}};
}
export type ContentIndex = {byId: Map<string, ContentRecord>; byName: Map<string, ContentRecord[]>};
export function indexContent(rows: ContentRecord[]): ContentIndex {
 const byId = new Map(rows.map(r => [r.sourceProductId, r]));
 const byName = new Map<string, ContentRecord[]>();
 for (const r of rows) byName.set(r.sourceName, [...(byName.get(r.sourceName) || []), r]);
 return {byId, byName};
}
function linkSegments(link: string | null | undefined): string[] {
 if (!link) return [];
 try { return new URL(link).pathname.split('/').filter(Boolean); } catch { return []; }
}
export type Match = {record: ContentRecord | null; method: 'uuid' | 'link' | 'name' | 'ambiguous' | 'none'};
// Account UUIDs can differ from marketplace UUIDs, so we try, in order: the same
// UUID, the product link (when it carries the marketplace UUID), then an exact,
// unique name. Two content rows with the same name never match by name.
export function matchContent(row: {uuid: string; link?: string | null; name: string}, index: ContentIndex): Match {
 const direct = index.byId.get(row.uuid);
 if (direct) return {record: direct, method: 'uuid'};
 // Exact path segment only: "mkt-1" must never match a link ending in "mkt-151".
 for (const segment of linkSegments(row.link)) { const record = index.byId.get(segment); if (record) return {record, method: 'link'}; }
 const named = index.byName.get(row.name) || [];
 if (named.length === 1) return {record: named[0], method: 'name'};
 return {record: null, method: named.length > 1 ? 'ambiguous' : 'none'};
}

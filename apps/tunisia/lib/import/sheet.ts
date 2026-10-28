// Reads a Shipper "retailer products" spreadsheet export and turns it into supplier content records
// plus a duplicate/gap report. Pure and offline: no network, no database, no new dependencies.
import {inflateRawSync} from 'node:zlib';
import type {ImportConfig} from './config';
import {imageAllowed, shortId, slugify, type ContentRecord} from './content';

// --- minimal .xlsx reader (zip + sharedStrings + first sheet) -------------------------------------------------
function zipEntries(buf: Buffer): Map<string, Buffer> {
 let eocd = -1;
 for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
 if (eocd < 0) throw new Error('Not a zip/xlsx file');
 const count = buf.readUInt16LE(eocd + 10);
 let p = buf.readUInt32LE(eocd + 16);
 const out = new Map<string, Buffer>();
 for (let n = 0; n < count; n++) {
  if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Corrupt zip directory');
  const method = buf.readUInt16LE(p + 10), size = buf.readUInt32LE(p + 20);
  const nameLen = buf.readUInt16LE(p + 28), extraLen = buf.readUInt16LE(p + 30), commentLen = buf.readUInt16LE(p + 32), offset = buf.readUInt32LE(p + 42);
  const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
  const dataStart = offset + 30 + buf.readUInt16LE(offset + 26) + buf.readUInt16LE(offset + 28);
  const raw = buf.subarray(dataStart, dataStart + size);
  if (method === 0) out.set(name, raw); else if (method === 8) out.set(name, inflateRawSync(raw)); else throw new Error(`Unsupported zip method ${method}`);
  p += 46 + nameLen + extraLen + commentLen;
 }
 return out;
}
const entities: Record<string, string> = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' '};
export function decodeEntities(s: string) {
 return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
  if (e[0] === '#') { const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m; }
  return entities[e.toLowerCase()] ?? m;
 });
}
const textOf = (xml: string) => decodeEntities([...xml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(m => m[1]).join(''));
const colIndex = (ref: string) => [...(/^[A-Z]+/.exec(ref)?.[0] ?? 'A')].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
export function readXlsx(buf: Buffer): Record<string, string>[] {
 const files = zipEntries(buf);
 const sheetName = [...files.keys()].filter(k => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort()[0];
 if (!sheetName) throw new Error('No worksheet found');
 const shared = files.has('xl/sharedStrings.xml') ? [...files.get('xl/sharedStrings.xml')!.toString('utf8').matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => textOf(m[1])) : [];
 const table: string[][] = [];
 for (const r of files.get(sheetName)!.toString('utf8').matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
  const cells: string[] = [];
  for (const c of r[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
   const ref = /r="([A-Z]+\d+)"/.exec(c[1])?.[1], type = /t="(\w+)"/.exec(c[1])?.[1], inner = c[2] ?? '';
   if (!ref) continue;
   const v = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1];
   cells[colIndex(ref)] = type === 's' && v !== undefined ? (shared[Number(v)] ?? '') : type === 'inlineStr' ? textOf(inner) : v !== undefined ? decodeEntities(v) : '';
  }
  table.push(cells);
 }
 const header = (table.shift() ?? []).map(h => (h ?? '').trim());
 return table.map(cells => Object.fromEntries(header.map((h, i) => [h, (cells[i] ?? '').trim()])));
}

// --- text helpers ---------------------------------------------------------------------------------------------
const arabic = /[؀-ۿݐ-ݿ]/;
export const isArabic = (s: string) => arabic.test(s);
export function htmlToText(html: string, max = 4000) {
 const text = decodeEntities(html
  .replace(/<\s*br\s*\/?>/gi, '\n').replace(/<\/(p|div|h[1-6]|ul|ol|table|tr)>/gi, '\n').replace(/<li[^>]*>/gi, '\n- ').replace(/<[^>]+>/g, ''))
  .replace(/[ \t ]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
 return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, '')}…` : text;
}
const norm = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export const normName = norm;
const num = (s: string) => { const n = Number(s); return s.trim() !== '' && Number.isFinite(n) ? n : null; };

// --- grouping and conversion ----------------------------------------------------------------------------------
export type SheetVariant = {id: string; label: string; stock: number | null};
export type SheetProduct = {
 id: string; supplier: string; name: string; description: string; images: string[]; category: string; variants: SheetVariant[];
 sellPrice: number | null; recommendedPrice: number | null; cost: number | null; stock: number; fulfilledBy: string;
};
// A row with a Parent ID is one variant of that product; the parent's own row is the first variant
// (its ID equals the Parent ID of its siblings). Rows without a Parent ID are single products.
export function groupProducts(rows: Record<string, string>[]): {products: SheetProduct[]; skipped: {id: string; reason: string}[]} {
 const groups = new Map<string, Record<string, string>[]>(), skipped: {id: string; reason: string}[] = [], seen = new Set<string>();
 for (const r of rows) {
  const id = r['ID'];
  if (!id) { skipped.push({id: '', reason: 'missing ID'}); continue; }
  if (seen.has(id)) { skipped.push({id, reason: 'duplicate ID in file'}); continue; }
  seen.add(id);
  const key = r['Parent ID'] || id;
  groups.set(key, [...(groups.get(key) || []), r]);
 }
 const products: SheetProduct[] = [];
 for (const [key, members] of groups) {
  const lead = members.find(m => m['ID'] === key) ?? members[0];
  const prices = members.map(m => num(m['Sell Price'])).filter((n): n is number => n !== null);
  const recs = members.map(m => num(m['Recommended Retail Price'])).filter((n): n is number => n !== null);
  const costs = members.map(m => num(m['Dropshipping Cost'])).filter((n): n is number => n !== null);
  products.push({
   id: key, supplier: lead['Supplier'] ?? '', name: lead['Name'] ?? '', description: lead['Description'] ?? '',
   images: [...new Set(members.flatMap(m => (m['Images'] || '').split('|').map(s => s.trim()).filter(Boolean)))],
   category: (lead['Categories'] || '').split('|')[0].trim(),
   variants: members.map(m => ({id: m['ID'], label: m['Variations'] || '', stock: num(m['Available Stock'])})),
   sellPrice: prices.length ? Math.min(...prices) : null, recommendedPrice: recs.length ? Math.min(...recs) : null, cost: costs.length ? Math.max(...costs) : null,
   stock: members.reduce((n, m) => n + Math.max(0, num(m['Available Stock']) ?? 0), 0), fulfilledBy: lead['Fulfilled By'] ?? '',
  });
 }
 return {products, skipped};
}

export function toContent(p: SheetProduct, config: Pick<ImportConfig, 'imageHosts'>): ContentRecord | null {
 const title = p.name.trim(), body = htmlToText(p.description);
 if (!title || !/^[a-zA-Z0-9-]+$/.test(p.id)) return null;
 const lang = isArabic(title) || isArabic(body) ? 'ar' : 'fr'; // supplier copy is French or Arabic; English is never guessed
 const empty = {en: '', fr: '', ar: ''};
 const provenance = {en: 'supplier', fr: 'supplier', ar: 'supplier'} as ContentRecord['provenance'];
 return {
  sourceProductId: p.id, sourceName: title, sourceUrl: `https://app.shipper.market/products/${p.id}`,
  slug: `${slugify(title) || 'product'}-${shortId(p.id)}`, category: p.category || 'other',
  title: {...empty, [lang]: title}, description: {...empty, [lang]: body},
  images: p.images.filter(i => imageAllowed(i, config.imageHosts)), provenance, reviewState: 'approved', rights: null,
 };
}

export type Flag = 'zero_stock' | 'no_recommended_price' | 'sell_at_or_below_cost' | 'short_description' | 'no_image' | 'no_stock_info' | 'already_in_shop' | 'possible_duplicate';
export type ReportRow = {id: string; name: string; supplier: string; category: string; variants: number; stock: number; sellPrice: number | null; recommendedPrice: number | null; language: 'ar' | 'fr'; flags: Flag[]; duplicateOf: string[]};
// Suspected duplicates are reported, never dropped: the same supplier often lists genuinely different
// sizes or sets under one name. A human decides.
// "Already in shop" matches by ID or by normalised name: export IDs can differ from the marketplace UUIDs behind published products.
export function analyse(products: SheetProduct[], opts: {existingIds?: Set<string>; existingNames?: Set<string>; imageHosts: string[]}): {rows: ReportRow[]; duplicateGroups: ReportRow[][]} {
 const byKey = new Map<string, SheetProduct[]>();
 for (const p of products) { const k = `${p.supplier}|${norm(p.name)}`; byKey.set(k, [...(byKey.get(k) || []), p]); }
 const dupOf = new Map<string, string[]>();
 for (const g of byKey.values()) if (g.length > 1) for (const p of g) dupOf.set(p.id, g.filter(o => o.id !== p.id).map(o => o.id));
 const rows = products.map<ReportRow>(p => {
  const flags: Flag[] = [];
  const unit = p.variants.map(v => v.stock);
  if (unit.every(s => s === null)) flags.push('no_stock_info'); else if (p.stock <= 0) flags.push('zero_stock');
  if (p.recommendedPrice === null) flags.push('no_recommended_price');
  if (p.cost !== null && p.sellPrice !== null && p.sellPrice <= p.cost) flags.push('sell_at_or_below_cost');
  if (htmlToText(p.description).length < 60) flags.push('short_description');
  if (!p.images.some(i => imageAllowed(i, opts.imageHosts))) flags.push('no_image');
  if (opts.existingIds?.has(p.id) || opts.existingNames?.has(norm(p.name))) flags.push('already_in_shop');
  if (dupOf.has(p.id)) flags.push('possible_duplicate');
  return {id: p.id, name: p.name, supplier: p.supplier, category: p.category, variants: p.variants.length, stock: p.stock, sellPrice: p.sellPrice, recommendedPrice: p.recommendedPrice,
   language: isArabic(p.name) || isArabic(htmlToText(p.description)) ? 'ar' : 'fr', flags, duplicateOf: dupOf.get(p.id) ?? []};
 });
 const byId = new Map(rows.map(r => [r.id, r]));
 const duplicateGroups = [...byKey.values()].filter(g => g.length > 1).map(g => g.map(p => byId.get(p.id)!));
 return {rows, duplicateGroups};
}

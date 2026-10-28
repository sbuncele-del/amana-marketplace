// Converts a Shipper "retailer products" .xlsx export into content records for `npm run catalogue:content`,
// and writes a duplicate/gap report. Offline: reads the file, writes files, touches no database or API.
// Usage: tsx scripts/sheet-to-content.mts <export.xlsx> [--out <dir>]
import fs from 'node:fs';
import path from 'node:path';
import {loadConfig} from '../lib/import/config';
import {analyse, groupProducts, normName, readXlsx, toContent} from '../lib/import/sheet';
const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const outDir = path.resolve(outIndex >= 0 ? args[outIndex + 1] : 'shipper-sheet-import');
const input = args.find((a, i) => !a.startsWith('--') && i !== outIndex + 1);
if (!input) throw new Error('Usage: sheet-to-content.mts <export.xlsx> [--out <dir>]');
const config = loadConfig();
const root = path.resolve(import.meta.dirname, '..');
const existing = new Set<string>(), existingNames = new Set<string>();
for (const f of ['data/shipper-content.json']) { const p = path.join(root, f); if (fs.existsSync(p)) for (const r of JSON.parse(fs.readFileSync(p, 'utf8'))) { existing.add(r.sourceProductId); existingNames.add(normName(r.sourceName)); } }
const rows = readXlsx(fs.readFileSync(input));
const {products, skipped} = groupProducts(rows);
const records = products.map(p => toContent(p, config)).filter((r): r is NonNullable<typeof r> => r !== null);
// Never overwrite or shadow curated content for products already live: same ID or same name is skipped.
const isLive = (r: {sourceProductId: string; sourceName: string}) => existing.has(r.sourceProductId) || existingNames.has(normName(r.sourceName));
const {rows: report, duplicateGroups} = analyse(products, {existingIds: existing, existingNames, imageHosts: config.imageHosts});
fs.mkdirSync(outDir, {recursive: true});
fs.writeFileSync(path.join(outDir, 'content.json'), JSON.stringify(records.filter(r => !isLive(r)), null, 1));
const csv = (v: unknown) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const header = ['id', 'name', 'supplier', 'category', 'variants', 'stock', 'sellPrice', 'recommendedPrice', 'language', 'flags', 'duplicateOf'];
fs.writeFileSync(path.join(outDir, 'report.csv'), [header.join(','), ...report.map(r => header.map(h => csv(Array.isArray((r as any)[h]) ? (r as any)[h].join(' ') : (r as any)[h])).join(','))].join('\n'));
const count = (flag: string) => report.filter(r => r.flags.includes(flag as any)).length;
const summary = {
 rowsInFile: rows.length, productsAfterGrouping: products.length, variantRows: rows.length - products.length, skipped: skipped.length, contentRecordsWritten: records.filter(r => !isLive(r)).length,
 alreadyInShop: count('already_in_shop'), possibleDuplicateGroups: duplicateGroups.length, productsInDuplicateGroups: count('possible_duplicate'),
 zeroStock: count('zero_stock'), noRecommendedPrice: count('no_recommended_price'), sellAtOrBelowCost: count('sell_at_or_below_cost'), shortDescription: count('short_description'), noImage: count('no_image'),
 sourceLanguage: {fr: report.filter(r => r.language === 'fr').length, ar: report.filter(r => r.language === 'ar').length, en: 0}, outDir,
};
fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 1));
console.log(JSON.stringify(summary, null, 1));

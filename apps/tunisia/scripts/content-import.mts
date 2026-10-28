// Loads supplier content (titles, descriptions, images) into the catalogue database and re-evaluates publish state.
// Input: JSON arrays of content rows (default: data/shipper-content.json and data/content/*.json).
import fs from 'node:fs';
import path from 'node:path';
import {flags, openStore} from '../lib/import/cli';
import {loadConfig} from '../lib/import/config';
import {parseContent, type ContentRecord} from '../lib/import/content';
import {reevaluate} from '../lib/import/runner';
import {createAnthropicTranslator, fillTranslations} from '../lib/import/translate';
const {dryRun, translate, strict, files} = flags(process.argv.slice(2));
const root = path.resolve(import.meta.dirname, '..');
const inputs = files.length ? files : [path.join(root, 'data/shipper-content.json'), ...(fs.existsSync(path.join(root, 'data/content')) ? fs.readdirSync(path.join(root, 'data/content')).filter(f => f.endsWith('.json')).map(f => path.join(root, 'data/content', f)) : [])];
const records: ContentRecord[] = [], rejected: {file: string; index: number; reason: string}[] = [];
for (const file of inputs) {
 const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
 if (!Array.isArray(rows)) throw new Error(`${file} must contain a JSON array`);
 rows.forEach((row: unknown, index: number) => { const r = parseContent(row); if (r.ok) records.push(r.value); else rejected.push({file: path.basename(file), index, reason: r.reason}); });
}
let translated = 0;
if (translate) {
 const apiKey = process.env.ANTHROPIC_API_KEY;
 if (!apiKey) throw new Error('--translate needs ANTHROPIC_API_KEY');
 const translator = createAnthropicTranslator({apiKey});
 for (let i = 0; i < records.length; i++) { const out = await fillTranslations(records[i], translator); records[i] = out.record; translated += out.translated; }
}
const {store, mode, close} = await openStore({dryRun});
const written = await store.upsertContent(records);
const config = loadConfig();
const evaluated = await reevaluate({store, config});
console.log(JSON.stringify({mode, inputs: inputs.map(f => path.basename(f)), valid: records.length, rejected: rejected.length, written, translatedFields: translated, productsReevaluated: evaluated.products}, null, 1));
if (rejected.length) console.log('rejected rows:', JSON.stringify(rejected.slice(0, 50)));
await close();
process.exit(strict && rejected.length ? 1 : 0);

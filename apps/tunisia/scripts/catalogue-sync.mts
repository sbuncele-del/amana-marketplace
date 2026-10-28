// Runs the account-catalogue import until it completes (resuming from the stored checkpoint).
// --dry-run: uses an in-memory database seeded from the local content files; nothing persistent is written.
import {flags, openStore, shipperToken} from '../lib/import/cli';
import {createShipperClient} from '../lib/import/client';
import {loadConfig} from '../lib/import/config';
import {runImport, reevaluate} from '../lib/import/runner';
import {parseContent} from '../lib/import/content';
import fs from 'node:fs';
import path from 'node:path';
const {dryRun} = flags(process.argv.slice(2));
const config = {...loadConfig(), budgetMs: 240000};
const {store, mode, close} = await openStore({dryRun});
if (dryRun) {
 const file = path.resolve(import.meta.dirname, '../data/shipper-content.json');
 const rows = JSON.parse(fs.readFileSync(file, 'utf8')).map(parseContent).filter((r: any) => r.ok).map((r: any) => r.value);
 await store.upsertContent(rows);
}
const client = createShipperClient({token: shipperToken()});
let summary;
for (let attempt = 0; attempt < 20; attempt++) {
 summary = await runImport({client, store, config, trigger: dryRun ? 'cli-dry-run' : 'cli'});
 console.log(JSON.stringify({mode, ...summary, client: client.stats}));
 if (summary.status !== 'paused') break;
}
await reevaluate({store, config});
console.log(JSON.stringify(await store.report(), null, 1));
await close();
process.exit(summary?.status === 'complete' ? 0 : 1);

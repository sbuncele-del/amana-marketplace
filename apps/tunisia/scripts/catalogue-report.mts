import {flags, openStore} from '../lib/import/cli';
const {dryRun} = flags(process.argv.slice(2));
const {store, close} = await openStore({dryRun});
console.log(JSON.stringify(await store.report(), null, 1));
await close();
process.exit(0);

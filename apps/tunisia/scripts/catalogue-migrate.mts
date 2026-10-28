import {openStore} from '../lib/import/cli';
const {store, mode, close} = await openStore();
console.log(`[catalogue] schema ready (${mode})`);
await store.db.query('SELECT 1');
await close();
process.exit(0);

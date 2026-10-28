// Shared setup for the command-line tools. Never prints credentials or supplier costs.
import {createPgDb, wrapPglite} from './db';
import {createStore, type CatalogueStore} from './store';
export async function openStore(opts: {dryRun?: boolean} = {}): Promise<{store: CatalogueStore; close: () => Promise<void>; mode: 'postgres' | 'memory'}> {
 if (opts.dryRun) {
  // Ephemeral in-memory Postgres: nothing is written anywhere persistent.
  const {PGlite} = await import('@electric-sql/pglite');
  const pg = new PGlite();
  const store = createStore(wrapPglite(pg as any));
  await store.ensureSchema();
  return {store, mode: 'memory', close: async () => { await pg.close(); }};
 }
 const url = process.env.TUNISIA_DATABASE_URL;
 if (!url) throw new Error('TUNISIA_DATABASE_URL is not set (use --dry-run to preview without a database)');
 const store = createStore(await createPgDb(url));
 await store.ensureSchema();
 return {store, mode: 'postgres', close: async () => {}};
}
export function shipperToken() {
 const token = process.env.SHIPPER_NETWORK_API_KEY || process.env.TUNISIA_SHIPPER_API_KEY;
 if (!token) throw new Error('SHIPPER_NETWORK_API_KEY is not set');
 return token;
}
export const flags = (argv: string[]) => ({dryRun: argv.includes('--dry-run'), translate: argv.includes('--translate'), strict: argv.includes('--strict'), files: argv.filter(a => !a.startsWith('--'))});

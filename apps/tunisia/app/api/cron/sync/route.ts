import {bearerMatches} from '@/lib/import/auth';
import {getCatalogueStore} from '@/lib/catalogue-source';
import {createShipperClient} from '@/lib/import/client';
import {loadConfig} from '@/lib/import/config';
import {runImport} from '@/lib/import/runner';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
// Scheduled or manual sync. Repeat calls resume from the stored checkpoint until the run completes.
export async function GET(request: Request) {
 if (!bearerMatches(request.headers.get('authorization'), process.env.CRON_SECRET)) return Response.json({error: 'Unauthorized'}, {status: 401});
 const token = process.env.SHIPPER_NETWORK_API_KEY || process.env.TUNISIA_SHIPPER_API_KEY;
 const store = await getCatalogueStore();
 if (!token || !store) return Response.json({error: 'Catalogue import is not configured'}, {status: 503});
 try {
  await store.ensureSchema();
  const summary = await runImport({client: createShipperClient({token}), store, config: loadConfig(), trigger: 'cron'});
  return Response.json(summary);
 } catch (e) {
  console.warn('[Tunisia] sync failed:', e instanceof Error ? e.message : 'error');
  return Response.json({error: 'Sync failed'}, {status: 500});
 }
}

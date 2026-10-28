import {bearerMatches} from '@/lib/import/auth';
import {getCatalogueStore} from '@/lib/catalogue-source';
export const dynamic = 'force-dynamic';
// Reconciliation report: counts and reasons only. No costs and no supplier payloads.
export async function GET(request: Request) {
 if (!bearerMatches(request.headers.get('authorization'), process.env.TUNISIA_ADMIN_TOKEN)) return Response.json({error: 'Unauthorized'}, {status: 401});
 const store = await getCatalogueStore();
 if (!store) return Response.json({error: 'Catalogue database is not configured'}, {status: 503});
 return Response.json(await store.report(), {headers: {'Cache-Control': 'no-store'}});
}

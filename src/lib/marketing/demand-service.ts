import 'server-only';
import {createHash} from 'node:crypto';
import {CommerceError} from '@/lib/commerce/access';
import {experiencePool} from '@/lib/experience/store';
import {parameters,evidence} from './demand.mjs';
const schema = `CREATE TABLE IF NOT EXISTS marketing_demand_cache (request_key text PRIMARY KEY, observed_at timestamptz NOT NULL DEFAULT now(), payload jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS marketing_demand_usage (id bigserial PRIMARY KEY, requested_at timestamptz NOT NULL DEFAULT now(), actor_id text NOT NULL, request_key text NOT NULL);`;
export async function runDemandComparison(body:{batch:string;window:string;searchType:string},actorId:string){
 let client;
 try {
    let params;
    try { params = parameters(body.batch, body.window, body.searchType); }
    catch { throw new CommerceError(400, 'Select a listed batch, window and search type.'); }
    if (!process.env.SERPAPI_API_KEY) throw new CommerceError(503, 'SERPAPI_API_KEY is missing from this deployment.');
    const key = createHash('sha256').update(JSON.stringify(params)).digest('hex');
    client = await experiencePool().connect();
    await client.query(schema);
    // Transaction lock serialises reservations across instances. Failed calls count too.
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(792046399)');
    const cached = await client.query("SELECT payload FROM marketing_demand_cache WHERE request_key=$1 AND observed_at > now()-interval '24 hours'", [key]);
    if (cached.rows[0]) {
      await client.query('COMMIT');
      return { ...cached.rows[0].payload, cached: true };
    }
    const count = await client.query("SELECT count(*)::int AS n FROM marketing_demand_usage WHERE requested_at >= date_trunc('day',now() AT TIME ZONE 'Africa/Johannesburg') AT TIME ZONE 'Africa/Johannesburg'");
    if (count.rows[0].n >= 24) throw new CommerceError(429, 'Daily research limit reached. Use saved results or try tomorrow.');
    const monthly=await client.query("SELECT count(*)::int AS n FROM marketing_demand_usage WHERE requested_at >= date_trunc('month',now() AT TIME ZONE 'Africa/Johannesburg') AT TIME ZONE 'Africa/Johannesburg'");
    if(monthly.rows[0].n>=150)throw new CommerceError(429,'Monthly research ceiling reached. No additional requests will be made.');
    // Recent identical reservation prevents parallel duplicate calls without an open network transaction.
    const active = await client.query("SELECT 1 FROM marketing_demand_usage WHERE request_key=$1 AND requested_at>now()-interval '2 minutes'", [key]);
    if (active.rows.length) throw new CommerceError(409, 'This comparison is already running. Try again shortly.');
    await client.query('INSERT INTO marketing_demand_usage(actor_id,request_key) VALUES($1,$2)', [actorId, key]);
    await client.query('COMMIT');
    const url = new URL('https://serpapi.com/search.json');
    for (const [k,v] of Object.entries(params)) url.searchParams.set(k,String(v));
    url.searchParams.set('api_key',process.env.SERPAPI_API_KEY);
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(40000) });
    if (!response.ok) throw new CommerceError(502, 'SerpApi request failed. Check account access and credits.');
    const payload = await response.json();
    if (payload.error) throw new CommerceError(502, 'SerpApi returned no usable result. No trend has been verified.');
    const explore = new URL('https://trends.google.com/trends/explore');
    explore.searchParams.set('geo','ZA'); explore.searchParams.set('q',params.q); explore.searchParams.set('date',params.date); explore.searchParams.set('gprop',params.gprop);
    const result = { observedAt: new Date().toISOString(), source: 'Google Trends via SerpApi', sourceUrl: explore.toString(), geography: 'ZA', batch: body.batch, window: body.window, searchType: body.searchType, terms: params.q.split(','), ...evidence(payload, params.q.split(',')), caveat: 'Relative search interest, not sales or absolute volume. Category interest is not exact-SKU demand. No publishing or ad spending is triggered.' };
    if (result.status === 'retrieved') await client.query('INSERT INTO marketing_demand_cache(request_key,payload) VALUES($1,$2) ON CONFLICT(request_key) DO UPDATE SET observed_at=now(),payload=excluded.payload', [key,JSON.stringify(result)]);
    return { ...result, cached: false };
  }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client?.release();}
}

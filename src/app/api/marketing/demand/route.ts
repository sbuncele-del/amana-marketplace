import { NextRequest, NextResponse } from 'next/server';
import { commerceActor, requireAdmin, CommerceError } from '@/lib/commerce/access';
import { requireOrigin, privateHeaders } from '@/lib/commerce/http';
import { batches, windows, searchTypes, validResearchToken } from '@/lib/marketing/demand.mjs';
export const runtime = 'nodejs';
export const maxDuration = 60;
import {runDemandComparison} from '@/lib/marketing/demand-service';
async function researchActor(request: NextRequest) {
  if (validResearchToken(request.headers.get('authorization'), process.env.MARKETING_RESEARCH_TOKEN, process.env.MARKETING_RESEARCH_TOKEN_EXPIRES_AT)) return {id:'marketing-research-service'};
  requireOrigin(request);
  const actor = await commerceActor(); requireAdmin(actor); return actor;
}
export async function GET() {
  try {
    requireAdmin(await commerceActor());
    return NextResponse.json({ configured: Boolean(process.env.SERPAPI_API_KEY), geography: 'ZA', batches, windows, searchTypes, dailyLimit: 24, cacheHours: 24 }, { headers: privateHeaders });
  } catch (e) { return failure(e); }
}
function failure(e: unknown) {
  if (e instanceof CommerceError) return NextResponse.json({ error: e.message }, { status: e.status, headers: privateHeaders });
  return NextResponse.json({ error: 'Demand research unavailable. No trend has been verified.' }, { status: 503, headers: privateHeaders });
}
export async function POST(request:NextRequest){
 try {const actor=await researchActor(request);return NextResponse.json(await runDemandComparison(await request.json(),actor.id),{headers:privateHeaders});}
 catch(e){return failure(e);}
}

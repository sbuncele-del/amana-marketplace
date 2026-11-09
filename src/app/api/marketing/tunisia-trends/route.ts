import {NextRequest,NextResponse} from 'next/server';
import {experiencePool} from '@/lib/experience/store';
import {runDemandComparison} from '@/lib/marketing/demand-service';
import {validResearchToken} from '@/lib/marketing/demand.mjs';
export const maxDuration=60;
export const dynamic='force-dynamic';
// Public search evidence only: no private catalogue, customer, cost or credential data.
export async function GET(){
 try{const {rows}=await experiencePool().query("SELECT payload FROM marketing_demand_cache WHERE payload->>'geography'='TN' AND observed_at>now()-interval '7 days'");return NextResponse.json({geography:'TN',records:rows.map(r=>r.payload)},{headers:{'Cache-Control':'public, max-age=0, s-maxage=60'}});}
 catch{return NextResponse.json({geography:'TN',records:[],error:'Research temporarily unavailable'},{status:503});}
}
export async function POST(request:NextRequest){
 if(!validResearchToken(request.headers.get('authorization'),process.env.TUNISIA_RESEARCH_TOKEN,process.env.TUNISIA_RESEARCH_TOKEN_EXPIRES_AT))return NextResponse.json({error:'Unauthorized'},{status:401});
 try{return NextResponse.json(await runDemandComparison({...await request.json(),market:'TN'},'tunisia-research-service'),{headers:{'Cache-Control':'no-store'}});}
 catch(e){const error=e as {status?:number;message?:string};return NextResponse.json({error:error.status?error.message:'Research unavailable'},{status:error.status||503});}
}

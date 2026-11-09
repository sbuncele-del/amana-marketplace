import {timingSafeEqual} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {runDemandComparison} from '@/lib/marketing/demand-service';
export const maxDuration=300;
export async function GET(request:NextRequest){
 const expected=process.env.CRON_SECRET?'Bearer '+process.env.CRON_SECRET:'';
 const actual=request.headers.get('authorization')||'';
 if(!expected||Buffer.byteLength(actual)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))return NextResponse.json({error:'Unauthorized'},{status:401});
 const groups=['outdoor','home','family','kitchen','beauty','electronics'];
 const batch=groups[Math.floor(Date.now()/86400000)%groups.length];
 const requests=[...['7d','30d','90d','12m'].map(window=>({batch,window,searchType:'web'})),{batch,window:'30d',searchType:'shopping'}];
 const results=[];
 for(const item of requests){try{const r=await runDemandComparison(item,'demand-research-scheduler');results.push({window:item.window,searchType:item.searchType,status:r.status,cached:r.cached});}catch{results.push({window:item.window,searchType:item.searchType,status:'unverified'});}}
 return NextResponse.json({batch,results,scope:'Research only. No posts published, prices changed or ad spend triggered.'},{headers:{'Cache-Control':'no-store'}});
}

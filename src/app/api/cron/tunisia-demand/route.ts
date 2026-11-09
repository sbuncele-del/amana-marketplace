import {timingSafeEqual} from 'node:crypto';
import {runDemandComparison} from '@/lib/marketing/demand-service';
export const maxDuration=300;
export async function GET(request:Request){
 const actual=Buffer.from(request.headers.get('authorization')||''),expected=Buffer.from('Bearer '+(process.env.CRON_SECRET||''));
 if(!process.env.CRON_SECRET||actual.length!==expected.length||!timingSafeEqual(actual,expected))return Response.json({error:'Unauthorized'},{status:401});
 const batches=['kitchen','beauty','home','electronics'],batch=batches[Math.floor(Date.now()/86400000)%batches.length],results=[];
 for(const item of [...['7d','30d','90d','12m'].map(window=>({window,searchType:'web'})),{window:'30d',searchType:'shopping'}]){
  try{const r=await runDemandComparison({market:'TN',batch,...item},'tunisia-demand-scheduler');results.push({...item,status:r.status,cached:r.cached});}catch{results.push({...item,status:'unverified'});}
 }
 return Response.json({geography:'TN',batch,results,scope:'Existing shared request caps apply. No publishing or ad spend.'});
}

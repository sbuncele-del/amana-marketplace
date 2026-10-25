import {randomUUID,timingSafeEqual} from 'node:crypto';
import {NextRequest,NextResponse} from 'next/server';
import {ensureExperienceSchema,experiencePool} from '@/lib/experience/store';
import {runLifecycle} from '@/lib/mail/lifecycle';
export const maxDuration=60;
export async function GET(request:NextRequest){
 const secret=process.env.CRON_SECRET,actual=request.headers.get('authorization')||'';
 if(!secret)return NextResponse.json({error:'Scheduler not configured'},{status:503});
 const expected='Bearer '+secret;
 if(Buffer.byteLength(actual)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))return NextResponse.json({error:'Unauthorized'},{status:401});
 const id=randomUUID();try{await ensureExperienceSchema();await experiencePool().query('INSERT INTO mail_lifecycle_runs(id) VALUES($1)',[id]);const result=await runLifecycle();await experiencePool().query("UPDATE mail_lifecycle_runs SET status='COMPLETED',finished_at=now(),processed=$2 WHERE id=$1",[id,result.processed]);return NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});}catch{await experiencePool().query("UPDATE mail_lifecycle_runs SET status='FAILED',finished_at=now() WHERE id=$1",[id]).catch(()=>{});return NextResponse.json({error:'Lifecycle processing failed'},{status:503});}
}

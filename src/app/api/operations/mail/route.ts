import {NextResponse} from 'next/server';
import {commerceActor} from '@/lib/commerce/access';
import {commerceFailure, privateHeaders} from '@/lib/commerce/http';
import {ensureExperienceSchema, experiencePool} from '@/lib/experience/store';
export async function GET() {
 try {
  const actor = await commerceActor();
  if (!actor.admin) return NextResponse.json({error: 'Administrator access required'}, {status:403});
  await ensureExperienceSchema();
  const events = await experiencePool().query('SELECT id,type,email_id,received_at FROM mail_webhook_events ORDER BY received_at DESC LIMIT 30');
  const lifecycle=await experiencePool().query('SELECT j.id,j.kind,j.status,j.due_at,j.attempts,j.accepted_at,j.responded_at,j.last_error,(SELECT e.type FROM mail_webhook_events e WHERE e.email_id=j.provider_id ORDER BY e.received_at DESC LIMIT 1) AS delivery_event FROM mail_lifecycle j ORDER BY j.created_at DESC LIMIT 50');
  const runs=await experiencePool().query('SELECT started_at,finished_at,status,processed FROM mail_lifecycle_runs ORDER BY started_at DESC LIMIT 1');
  const metrics=await experiencePool().query("SELECT kind,count(*) FILTER(WHERE status='ACCEPTED')::int AS accepted,count(*) FILTER(WHERE responded_at IS NOT NULL)::int AS responses,count(*) FILTER(WHERE EXISTS(SELECT 1 FROM mail_webhook_events e WHERE e.email_id=mail_lifecycle.provider_id AND e.type='email.delivered'))::int AS delivered,count(*) FILTER(WHERE EXISTS(SELECT 1 FROM mail_webhook_events e WHERE e.email_id=mail_lifecycle.provider_id AND e.type='email.clicked'))::int AS clicked FROM mail_lifecycle GROUP BY kind");
  return NextResponse.json({lastRun:runs.rows[0]||null,metrics:metrics.rows,lifecycle:lifecycle.rows,schedulerConfigured:Boolean(process.env.CRON_SECRET),configured:Boolean(process.env.RESEND_WEBHOOK_SECRET),events:events.rows},{headers:privateHeaders});
 } catch(e) {return commerceFailure(e);}
}

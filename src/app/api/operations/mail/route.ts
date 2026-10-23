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
  return NextResponse.json({configured:Boolean(process.env.RESEND_WEBHOOK_SECRET),events:events.rows},{headers:privateHeaders});
 } catch(e) {return commerceFailure(e);}
}

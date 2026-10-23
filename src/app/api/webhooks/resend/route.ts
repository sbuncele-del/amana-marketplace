import {NextRequest, NextResponse} from 'next/server';
import {resend} from '@/lib/mail/send';
import {ensureExperienceSchema, experiencePool} from '@/lib/experience/store';
import {suppress} from '@/lib/mail/subscribers';

// Resend delivery events. Hard bounces and spam complaints are suppressed so we never mail those addresses again.
export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({error: 'Webhook is not configured'}, {status: 503});
  const body = await request.text();
  let event;
  try {
    event = resend().webhooks.verify({payload: body, headers: {id: request.headers.get('svix-id') ?? '', timestamp: request.headers.get('svix-timestamp') ?? '', signature: request.headers.get('svix-signature') ?? ''}, webhookSecret: secret});
  } catch {
    return NextResponse.json({error: 'Invalid signature'}, {status: 400});
  }
  const data = event.data as {to?: string[]; bounce?: {type?: string}};
  for (const to of data.to || []) {
    if (event.type === 'email.complained') await suppress(to, 'COMPLAINED');
    if (event.type === 'email.bounced' && data.bounce?.type?.toLowerCase() === 'permanent') await suppress(to, 'BOUNCED');
  }
  await ensureExperienceSchema();
  await experiencePool().query('INSERT INTO mail_webhook_events(id,type,email_id) VALUES($1,$2,$3) ON CONFLICT(id) DO NOTHING', [request.headers.get('svix-id'), event.type, (event.data as {email_id?: string}).email_id || null]);
  return NextResponse.json({received: true});
}

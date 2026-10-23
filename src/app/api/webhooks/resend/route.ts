import {NextRequest, NextResponse} from 'next/server';
import {resend} from '@/lib/mail/send';
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
  const to = data.to?.[0];
  if (to && event.type === 'email.complained') await suppress(to, 'COMPLAINED');
  if (to && event.type === 'email.bounced' && data.bounce?.type?.toLowerCase() === 'permanent') await suppress(to, 'BOUNCED');
  return NextResponse.json({received: true});
}

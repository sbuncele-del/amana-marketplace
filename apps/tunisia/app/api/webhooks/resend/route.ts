import {Pool} from 'pg';
import {parseEvent, problemEvent, verifyWebhook, webhookSchema} from '@/lib/mail/resend-webhook';

const headers = {'Cache-Control': 'no-store'};
const reply = (status: number, body: Record<string, unknown>) => Response.json(body, {status, headers});
let pool: Pool | undefined, ready: Promise<unknown> | undefined;

// Resend delivery events (delivered, bounced, complained...) for the Tunisia order emails. Each event is stored once,
// keyed by Resend's message id, so retries are harmless. Closed (503) until the signing secret is set.
export async function POST(request: Request) {
  const secret = process.env.TUNISIA_RESEND_WEBHOOK_SECRET || process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return reply(503, {code: 'WEBHOOK_NOT_CONFIGURED'});
  const body = await request.text();
  if (body.length > 100000) return reply(413, {code: 'TOO_LARGE'});
  const id = request.headers.get('svix-id');
  if (!verifyWebhook(body, {id, timestamp: request.headers.get('svix-timestamp'), signature: request.headers.get('svix-signature')}, secret)) return reply(400, {code: 'INVALID_SIGNATURE'});
  const event = parseEvent(body);
  if (!event) return reply(400, {code: 'INVALID_EVENT'});
  if (problemEvent(event.type)) console.error('[tn-mail]', event.type, event.emailId, event.to.join(','));
  const databaseUrl = process.env.TUNISIA_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!databaseUrl) return reply(200, {received: true, stored: false});
  try {
    pool ??= new Pool({connectionString: databaseUrl, max: 2, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000});
    await (ready ??= pool.query(webhookSchema).catch(e => { ready = undefined; throw e; }));
    await pool.query('INSERT INTO public.plentovo_tn_mail_events(id,type,email_id,recipients,subject) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING', [id, event.type, event.emailId, event.to, event.subject]);
    return reply(200, {received: true, stored: true});
  } catch (error) {
    console.error('[tn-mail] store failed', error);
    return reply(500, {code: 'TEMPORARY'}); // Resend retries
  }
}

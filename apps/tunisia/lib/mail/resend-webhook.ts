// Resend signs webhooks with Svix: HMAC-SHA256 over "<id>.<timestamp>.<body>" using the base64 secret after "whsec_".
// Verified here directly so the Tunisia app needs no extra dependency.
import {createHmac, timingSafeEqual} from 'node:crypto';

export const webhookSchema = `CREATE TABLE IF NOT EXISTS public.plentovo_tn_mail_events (
 id text PRIMARY KEY, type text NOT NULL, email_id text, recipients text[], subject text, received_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS plentovo_tn_mail_events_email ON public.plentovo_tn_mail_events (email_id);`;

const TOLERANCE_SECONDS = 300;

export type MailEvent = {type: string; emailId: string | null; to: string[]; subject: string | null};

export function verifyWebhook(body: string, headers: {id: string | null; timestamp: string | null; signature: string | null}, secret: string, nowMs = Date.now()): boolean {
  const {id, timestamp, signature} = headers;
  if (!id || !timestamp || !signature || !secret) return false;
  const sent = Number(timestamp);
  if (!Number.isFinite(sent) || Math.abs(nowMs / 1000 - sent) > TOLERANCE_SECONDS) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest();
  return signature.split(' ').some(part => {
    const [version, value] = part.split(',');
    if (version !== 'v1' || !value) return false;
    const given = Buffer.from(value, 'base64');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

export function parseEvent(body: string): MailEvent | null {
  try {
    const e = JSON.parse(body) as {type?: unknown; data?: {email_id?: unknown; to?: unknown; subject?: unknown}};
    if (typeof e.type !== 'string') return null;
    const d = e.data ?? {};
    return {
      type: e.type,
      emailId: typeof d.email_id === 'string' ? d.email_id : null,
      to: Array.isArray(d.to) ? d.to.filter((x): x is string => typeof x === 'string') : [],
      subject: typeof d.subject === 'string' ? d.subject : null,
    };
  } catch { return null; }
}

// Events that mean an email did not reach its recipient; these are written to the server log so they are noticed.
export const problemEvent = (type: string) => ['email.bounced', 'email.complained', 'email.failed', 'email.suppressed'].includes(type);

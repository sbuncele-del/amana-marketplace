import 'server-only';
import {Resend} from 'resend';
import {toText} from './layout';

let client: Resend | undefined;
export function resend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not configured');
  return (client ??= new Resend(key));
}

export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.FROM_EMAIL);
}

/** e.g. "Plentovo <hello@plentovo.com>"; replies go to the same mailbox unless REPLY_TO_EMAIL is set. */
function sender() {
  const from = process.env.FROM_EMAIL;
  if (!from) throw new Error('FROM_EMAIL is not configured');
  return {from, replyTo: process.env.REPLY_TO_EMAIL || from.match(/<([^>]+)>/)?.[1] || from};
}

export type Mail = {
  to: string;
  subject: string;
  html: string;
  tags?: Record<string, string>;
  /** Marketing mail carries RFC 8058 one-click unsubscribe headers. */
  unsubscribeUrl?: string;
  idempotencyKey?: string;
};

function payload(mail: Mail) {
  const {from, replyTo} = sender();
  return {
    from,
    to: mail.to,
    replyTo,
    subject: mail.subject,
    html: mail.html,
    text: toText(mail.html),
    tags: mail.tags && Object.entries(mail.tags).map(([name, value]) => ({name, value: value.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 256)})),
    headers: mail.unsubscribeUrl
      ? {'List-Unsubscribe': `<${mail.unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'}
      : undefined,
  };
}

export async function sendMail(mail: Mail) {
  const {data, error} = await resend().emails.send(payload(mail), mail.idempotencyKey ? {idempotencyKey: mail.idempotencyKey} : undefined);
  if (error) throw new Error(`Resend rejected the message: ${error.message}`);
  return data!.id;
}

/** Sends up to 100 messages per API call; returns one provider id (or null on failure) per input, in order. */
export async function sendBatch(mails: Mail[], idempotencyKey?: string) {
  const out: (string | null)[] = [];
  for (let i = 0; i < mails.length; i += 100) {
    const chunk = mails.slice(i, i + 100);
    const {data, error} = await resend().batch.send(chunk.map(payload), idempotencyKey ? {idempotencyKey: `${idempotencyKey}-${i / 100}`} : undefined);
    if (error || !data) out.push(...chunk.map(() => null));
    else out.push(...chunk.map((_m, n) => data.data[n]?.id ?? null));
  }
  return out;
}

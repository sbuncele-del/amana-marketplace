import 'server-only';
import {createHash, randomBytes, randomUUID} from 'node:crypto';
import {transaction, experiencePool, ensureExperienceSchema} from '@/lib/experience/store';
import {welcomeRecommendations} from './welcome-products';
import {resend, sendMail} from './send';
import {confirmSubscriptionEmail, welcomeEmail, oneClickUnsubscribe} from './templates';

export const CONSENT_TEXT = 'I agree to receive Plentovo news, new arrivals and offers by email. I can unsubscribe at any time.';

const hashIp = (ip: string) => createHash('sha256').update(`${process.env.NEXTAUTH_SECRET || 'plentovo'}:${ip}`).digest('hex').slice(0, 32);
const newToken = () => randomBytes(24).toString('base64url');

/** Records the sign-up with consent evidence and sends the double opt-in email. Always reports success to the caller. */
export async function requestSubscription(email: string, source: string, ip: string, market: string | null = null) {
  const row = await transaction(async client => {
    const existing = (await client.query('SELECT id,status,token,confirmation_sent_at FROM marketing_subscribers WHERE email=$1 FOR UPDATE', [email])).rows[0];
    if (existing?.status === 'ACTIVE') return {...existing, send: 'none' as const};
    if (existing?.status === 'BOUNCED' || existing?.status === 'COMPLAINED') return {...existing, send: 'none' as const};
    // Do not re-send a confirmation more than once every 10 minutes.
    if (existing?.status === 'PENDING' && existing.confirmation_sent_at && Date.now() - existing.confirmation_sent_at.getTime() < 10 * 60_000) return {...existing, send: 'none' as const};
    if (existing) {
      await client.query("UPDATE marketing_subscribers SET status='PENDING',consent_text=$2,consent_ip_hash=$3,consented_at=now(),market_code=$4,confirmation_sent_at=now(),updated_at=now() WHERE id=$1", [existing.id, CONSENT_TEXT, hashIp(ip), market]);
      return {...existing, send: 'confirm' as const};
    }
    const id = randomUUID(), token = newToken();
    await client.query('INSERT INTO marketing_subscribers(id,email,source,token,consent_text,consent_ip_hash,consented_at,confirmation_sent_at,market_code) VALUES($1,$2,$3,$4,$5,$6,now(),now(),$7)', [id, email, source, token, CONSENT_TEXT, hashIp(ip), market]);
    return {id, token, status: 'PENDING', send: 'confirm' as const};
  });
  if (row.send === 'confirm') {
    const mail = confirmSubscriptionEmail(row.token);
    await sendMail({to: email, ...mail, tags: {type: 'confirm-subscription'}});
  }
}

export async function confirmSubscription(token: string) {
  await ensureExperienceSchema();
  const sub = (await experiencePool().query(
    `UPDATE marketing_subscribers s SET status='ACTIVE',confirmed_at=COALESCE(s.confirmed_at,now()),unsubscribed_at=NULL,updated_at=now()
     FROM (SELECT id,confirmed_at AS prev FROM marketing_subscribers WHERE token=$1) o
     WHERE s.id=o.id AND s.status IN ('PENDING','ACTIVE','UNSUBSCRIBED')
     RETURNING s.email,s.token,s.market_code,(o.prev IS NULL) AS first`, [token])).rows[0];
  if (!sub) return 'invalid' as const;
  if (sub.first) {
    const products = await welcomeRecommendations(sub.market_code).catch(e => {console.error('[mail] recommendations unavailable', e); return [];});
    const mail = welcomeEmail(sub.token, products, sub.market_code);
    await sendMail({to: sub.email, ...mail, unsubscribeUrl: oneClickUnsubscribe(sub.token), tags: {type: 'welcome'}}).catch(e => console.error('[mail] welcome failed', e));
  }
  await syncContact(sub.email, false);
  return 'confirmed' as const;
}

export async function unsubscribe(token: string) {
  await ensureExperienceSchema();
  const sub = (await experiencePool().query("UPDATE marketing_subscribers SET status='UNSUBSCRIBED',unsubscribed_at=now(),updated_at=now() WHERE token=$1 AND status<>'UNSUBSCRIBED' RETURNING id,email", [token])).rows[0];
  if (sub) await syncContact(sub.email, true);
  return Boolean(sub) || Boolean((await experiencePool().query("SELECT 1 FROM marketing_subscribers WHERE token=$1", [token])).rowCount);
}

export async function suppress(email: string, status: 'BOUNCED' | 'COMPLAINED') {
  await ensureExperienceSchema();
  const sub = (await experiencePool().query("UPDATE marketing_subscribers SET status=$2,updated_at=now() WHERE email=$1 AND status IN ('ACTIVE','PENDING') RETURNING id", [email.toLowerCase(), status])).rows[0];
  if (sub) await syncContact(email.toLowerCase(), true);
}

/** Mirrors the subscriber into Resend so it also appears in the dashboard. Our table stays the source of truth. */
async function syncContact(email: string, unsubscribed: boolean) {
  try {
    const existing = await resend().contacts.get({email});
    if (existing.data?.id) await resend().contacts.update({email, unsubscribed});
    else await resend().contacts.create({email, unsubscribed});
  } catch (e) {
    console.error('[mail] contact sync failed', e);
  }
}

export async function subscriberStats() {
  await ensureExperienceSchema();
  const rows = (await experiencePool().query('SELECT status,count(*)::int AS n FROM marketing_subscribers GROUP BY status')).rows;
  return Object.fromEntries(rows.map(r => [r.status, r.n])) as Record<string, number>;
}

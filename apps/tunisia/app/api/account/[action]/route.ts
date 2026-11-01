import {checkCode, clearedCookie, createSession, deleteCustomer, endSession, issueCode, listOrders, normaliseEmail, orderStage, saveProfile, sessionCookie, signInCustomer} from '@/lib/account/auth';
import {accountConfig, accountDb, badOrigin, currentCustomer, reply} from '@/lib/account/server';
import {codeEmail} from '@/lib/account/email';
import {governorates, tunisianPhone} from '@/lib/orders/cod';

type Ctx = {params: Promise<{action: string}>};
const closed = () => reply(503, {code: 'ACCOUNTS_NOT_OPEN'});
const loc = (v: unknown): 'en' | 'fr' | 'ar' => (v === 'en' || v === 'ar' ? v : 'fr');
const read = async (request: Request): Promise<Record<string, unknown>> => {
  const raw = await request.text();
  if (raw.length > 5000) return {};
  try { const b = JSON.parse(raw); return b && typeof b === 'object' ? b : {}; } catch { return {}; }
};
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '');

// Optional customer accounts: email-code sign-in, order list, saved details, guest order lookup, deletion.
export async function GET(request: Request, {params}: Ctx) {
  if ((await params).action !== 'me') return reply(404, {code: 'NOT_FOUND'});
  const cfg = accountConfig(process.env); if (!cfg) return closed();
  try {
    const db = await accountDb(cfg), session = await currentCustomer(request, db);
    if (!session) return reply(401, {code: 'SIGNED_OUT'});
    return reply(200, {customer: session.customer, orders: await listOrders(db, session.customer.id)});
  } catch (e) { console.error('[tn-account] me failed', e instanceof Error ? e.message : e); return reply(503, {code: 'TEMPORARY'}); }
}

export async function POST(request: Request, {params}: Ctx) {
  const {action} = await params;
  const cfg = accountConfig(process.env); if (!cfg) return closed();
  if (badOrigin(request)) return reply(403, {code: 'BAD_ORIGIN'});
  const body = await read(request);
  try {
    const db = await accountDb(cfg);
    if (action === 'code') {
      const email = normaliseEmail(body.email);
      if (!email) return reply(422, {code: 'INVALID_EMAIL'});
      if (body.consent !== true) return reply(422, {code: 'CONSENT_REQUIRED'});
      const issued = await issueCode(db, email, cfg.secret);
      if (issued.status === 'wait') return reply(429, {code: 'WAIT', seconds: issued.seconds});
      const mail = codeEmail(loc(body.locale), issued.code);
      const r = await fetch('https://api.resend.com/emails', {method: 'POST', signal: AbortSignal.timeout(10000), headers: {Authorization: `Bearer ${cfg.resendKey}`, 'Content-Type': 'application/json'}, body: JSON.stringify({from: cfg.from, to: [email], subject: mail.subject, html: mail.html, tags: [{name: 'type', value: 'tn-signin-code'}]})});
      if (!r.ok) { console.error('[tn-account] code email failed', r.status); return reply(503, {code: 'TEMPORARY'}); }
      return reply(200, {sent: true});
    }
    if (action === 'verify') {
      const email = normaliseEmail(body.email);
      if (!email || !(await checkCode(db, email, text(body.code, 6), cfg.secret))) return reply(401, {code: 'WRONG_CODE'});
      const customer = await signInCustomer(db, email, loc(body.locale)), {token, expires} = await createSession(db, customer.id);
      return reply(200, {customer, orders: await listOrders(db, customer.id)}, {'Set-Cookie': sessionCookie(token, expires)});
    }
    if (action === 'track') { // guests: order reference + the phone number used on the order
      const phone = tunisianPhone(body.phone), reference = text(body.reference, 20).toUpperCase();
      if (!phone || !/^TN-[0-9A-F]{8}$/.test(reference)) return reply(404, {code: 'NOT_FOUND'});
      const row = (await db.query("SELECT status,shipper_status,created_at FROM public.plentovo_tn_orders WHERE reference=$1 AND customer->>'phone'=$2", [reference, phone])).rows[0];
      return row ? reply(200, {reference, status: orderStage(row.status, row.shipper_status), createdAt: new Date(row.created_at).toISOString()}) : reply(404, {code: 'NOT_FOUND'});
    }
    const session = await currentCustomer(request, db);
    if (!session) return reply(401, {code: 'SIGNED_OUT'});
    if (action === 'logout') { await endSession(db, session.token); return reply(200, {ok: true}, {'Set-Cookie': clearedCookie}); }
    if (action === 'profile') {
      const phone = text(body.phone, 30) ? tunisianPhone(body.phone) : '', governorate = text(body.governorate, 40);
      if (phone === null || (governorate && !(governorates as readonly string[]).includes(governorate))) return reply(422, {code: 'INVALID_DETAILS'});
      await saveProfile(db, session.customer.id, {name: text(body.name, 100), phone, governorate, delegation: text(body.delegation, 80), address: text(body.address, 300)});
      return reply(200, {ok: true});
    }
    if (action === 'delete') {
      if (body.confirm !== true) return reply(422, {code: 'CONFIRM_REQUIRED'});
      await deleteCustomer(db, session.customer.id, session.customer.email);
      return reply(200, {ok: true}, {'Set-Cookie': clearedCookie});
    }
    return reply(404, {code: 'NOT_FOUND'});
  } catch (e) { console.error('[tn-account] failed', action, e instanceof Error ? e.message : e); return reply(503, {code: 'TEMPORARY'}); }
}

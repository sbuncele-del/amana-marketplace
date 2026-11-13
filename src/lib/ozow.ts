import 'server-only';
import {createHmac, timingSafeEqual} from 'node:crypto';

// Ozow One API (https://hub.ozow.com). Pay by Bank, hosted checkout.
const BASE = 'https://one.ozow.com/v1';

export type OzowConfig = {clientId: string; clientSecret: string; siteCode: string; webhookSecret: string};

/** Returns null (feature off) unless explicitly enabled AND fully configured. */
export function ozowConfig(): OzowConfig | null {
  if (process.env.OZOW_PAY_ENABLED !== 'true') return null;
  const clientId = process.env.OZOW_PAY_CLIENT_ID?.trim();
  const clientSecret = process.env.OZOW_PAY_CLIENT_SECRET?.trim();
  const siteCode = process.env.OZOW_PAY_SITE_CODE?.trim();
  const webhookSecret = process.env.OZOW_PAY_WEBHOOK_SECRET?.trim();
  if (!clientId || !clientSecret || !siteCode || !webhookSecret) return null;
  return {clientId, clientSecret, siteCode, webhookSecret};
}

let cached: {token: string; expiresAt: number} | null = null;

async function accessToken(config: OzowConfig) {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const response = await fetch(`${BASE}/token`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({client_id: config.clientId, client_secret: config.clientSecret, scope: 'payments', grant_type: 'client_credentials'}),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`OZOW_TOKEN_${response.status}`);
  const body = await response.json() as {access_token?: string; expires_in?: number | string};
  if (!body.access_token) throw new Error('OZOW_TOKEN_EMPTY');
  cached = {token: body.access_token, expiresAt: Date.now() + (Number(body.expires_in) || 3600) * 1000};
  return cached.token;
}

async function call(config: OzowConfig, path: string, init: {method?: string; body?: unknown; idempotencyKey?: string} = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${await accessToken(config)}`,
      ...(init.body ? {'Content-Type': 'application/json'} : {}),
      ...(init.idempotencyKey ? {'Idempotency-Key': init.idempotencyKey} : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  });
  if (response.status === 401) cached = null;
  return response;
}

export async function createOzowPayment(config: OzowConfig, input: {
  amountCents: number; merchantReference: string; beneficiaryReference: string; expireAt: Date; returnUrl: string; idempotencyKey: string;
}) {
  const response = await call(config, '/payments', {
    method: 'POST', idempotencyKey: input.idempotencyKey,
    body: {
      siteCode: config.siteCode,
      amount: {currency: 'ZAR', value: Number((input.amountCents / 100).toFixed(2))},
      merchantReference: input.merchantReference,
      beneficiaryReference: input.beneficiaryReference,
      expireAt: input.expireAt.toISOString(),
      returnUrl: input.returnUrl,
      region: 'ZA',
    },
  });
  if (!response.ok) throw new Error(`OZOW_PAYMENT_${response.status}`);
  const body = await response.json() as {id?: string; status?: string; redirectUrl?: string};
  if (!body.id || !body.redirectUrl || !/^https:\/\//.test(body.redirectUrl)) throw new Error('OZOW_PAYMENT_NO_REDIRECT');
  return {id: body.id, redirectUrl: body.redirectUrl};
}

export type OzowTransaction = {
  id: string; merchantReference: string; siteCode: string; status: string; reason?: string;
  amount?: {currency?: string; value?: number | string};
};

/** Authoritative lookup. Never trust a webhook body or a browser return for the outcome. */
export async function getOzowTransaction(config: OzowConfig, id: string): Promise<OzowTransaction | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const response = await call(config, `/transactions/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`OZOW_TRANSACTION_${response.status}`);
  return await response.json() as OzowTransaction;
}

/** Svix signature check per Ozow's "Verify a webhook signature". Raw body required. */
export function verifyOzowWebhook(rawBody: string, headers: Headers, secret: string, now = Date.now()) {
  const id = headers.get('svix-id');
  const timestamp = headers.get('svix-timestamp');
  const signatures = headers.get('svix-signature');
  if (!id || !timestamp || !signatures) return false;
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds) || Math.abs(now / 1000 - seconds) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${rawBody}`).digest();
  return signatures.split(' ').some(entry => {
    const [version, value] = entry.split(',');
    if (version !== 'v1' || !value) return false;
    const given = Buffer.from(value, 'base64');
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}

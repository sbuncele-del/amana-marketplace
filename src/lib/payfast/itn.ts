// Verifies a Payfast instant transaction notification (ITN). Payfast's four checks, in order: the signature is valid,
// the request came from Payfast, the amount matches our order, and Payfast confirms the data when asked directly.
// Network access is injected so this can be tested.
import {notificationSignatureValid, paramString, parseBody} from './signature';
import type {PayfastConfig} from './config';

export type ItnDeps = {
  resolveIps: (host: string) => Promise<string[]>;
  postValidate: (url: string, body: string) => Promise<string>;
};
export type ItnResult =
  | {ok: true; paymentRef: string; grossCents: number; feeCents: number | null; netCents: number | null}
  | {ok: false; kind: 'invalid' | 'not_complete' | 'unavailable'; reason: string};

const rand = /^\d{1,9}\.\d{2}$/;
const toCents = (v: string | undefined) => (v !== undefined && rand.test(v.trim()) ? Math.round(Number(v) * 100) : null);
const bad = (reason: string): ItnResult => ({ok: false, kind: 'invalid', reason});

/** The order reference a notification claims to be for, read before anything is trusted. */
export const claimedReference = (rawBody: string) => parseBody(rawBody).find(([k]) => k === 'm_payment_id')?.[1] ?? '';

export async function verifyItn(
  input: {rawBody: string; sourceIp: string | null; expected: {reference: string; totalCents: number}},
  cfg: PayfastConfig, deps: ItnDeps,
): Promise<ItnResult> {
  const pairs = parseBody(input.rawBody), get = (k: string) => pairs.find(([key]) => key === k)?.[1];
  if (!notificationSignatureValid(pairs, cfg.passphrase)) return bad('Signature does not match.');
  if (get('m_payment_id') !== input.expected.reference) return bad('Order reference does not match.');
  if (get('merchant_id') !== cfg.merchantId) return bad('Merchant does not match.');
  const gross = toCents(get('amount_gross'));
  if (gross === null || gross !== input.expected.totalCents) return bad('Amount does not match the order.');
  if (get('payment_status') !== 'COMPLETE') return {ok: false, kind: 'not_complete', reason: `Payment status is ${get('payment_status') ?? 'missing'}.`};
  if (!input.sourceIp) return bad('Source address is unknown.');
  try {
    const allowed = new Set((await Promise.all(cfg.hosts.map(h => deps.resolveIps(h)))).flat());
    if (!allowed.has(input.sourceIp)) return bad('Request did not come from Payfast.');
    const answer = (await deps.postValidate(cfg.validateUrl, paramString(pairs.filter(([k]) => k !== 'signature'), {skipEmpty: false}))).trim();
    if (answer !== 'VALID') return bad('Payfast did not confirm the notification.');
  } catch {
    return {ok: false, kind: 'unavailable', reason: 'Could not reach Payfast to confirm the notification.'};
  }
  return {ok: true, paymentRef: get('pf_payment_id') ?? '', grossCents: gross, feeCents: toCents(get('amount_fee')?.replace(/^-/, '')), netCents: toCents(get('amount_net'))};
}

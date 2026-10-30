// Payfast settings come only from the environment. Without them (or without PAYFAST_ENABLED=true) online payment
// stays off. Live mode additionally requires a passphrase.
export type PayfastConfig = {
  mode: 'sandbox' | 'live'; merchantId: string; merchantKey: string; passphrase: string; siteUrl: string;
  processUrl: string; validateUrl: string; hosts: string[];
};

export function payfastConfig(env: Record<string, string | undefined>): PayfastConfig | null {
  if (env.PAYFAST_ENABLED !== 'true') return null;
  const merchantId = (env.PAYFAST_MERCHANT_ID ?? '').trim(), merchantKey = (env.PAYFAST_MERCHANT_KEY ?? '').trim();
  const passphrase = (env.PAYFAST_PASSPHRASE ?? '').trim();
  const mode = env.PAYFAST_MODE === 'live' ? 'live' : 'sandbox';
  const siteUrl = (env.PAYFAST_SITE_URL || 'https://plentovo.com').replace(/\/+$/, '');
  if (!merchantId || !merchantKey || (mode === 'live' && !passphrase) || !/^https:\/\//.test(siteUrl)) return null;
  const host = mode === 'live' ? 'www.payfast.co.za' : 'sandbox.payfast.co.za';
  return {
    mode, merchantId, merchantKey, passphrase, siteUrl,
    processUrl: `https://${host}/eng/process`, validateUrl: `https://${host}/eng/query/validate`,
    hosts: mode === 'live' ? ['www.payfast.co.za', 'w1w.payfast.co.za', 'w2w.payfast.co.za'] : ['sandbox.payfast.co.za'],
  };
}

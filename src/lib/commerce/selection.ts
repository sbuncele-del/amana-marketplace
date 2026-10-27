import 'server-only';
import {cookies, headers} from 'next/headers';
import {cache} from 'react';
import {ensureCommerce} from './store';
import {experiencePool} from '@/lib/experience/store';

// A saved choice is a browsing preference, never a payment or fulfilment authorization.
export const selectedMarket = cache(async () => {
 try {
  const saved = (await cookies()).get('plentovo-market')?.value;
  const detected = (await headers()).get('x-vercel-ip-country');
  const code = saved || (detected && /^[A-Z]{2}$/.test(detected) ? detected : "ZA");
  if (!code) return null;
  await ensureCommerce();
  const row = (await experiencePool().query("SELECT code,name,currency FROM commerce_markets WHERE (code=$1 OR code='ZA') AND status='ACTIVE' ORDER BY CASE WHEN code=$1 THEN 0 ELSE 1 END LIMIT 1", [code])).rows[0];
  return row ? {code: String(row.code), name: String(row.name), currency: String(row.currency)} : null;
 } catch { return null; }
});
export async function catalogueMarket() {
  // The existing supplier adapter serves ZA only. Other adapters must explicitly opt in.
  return (await selectedMarket())?.code === 'ZA';
}

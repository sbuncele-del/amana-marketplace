import 'server-only';
import {cookies} from 'next/headers';
import {cache} from 'react';
import {ensureCommerce} from './store';
import {experiencePool} from '@/lib/experience/store';

// A saved choice is a browsing preference, never a payment or fulfilment authorization.
export const selectedMarket = cache(async () => {
 try {
  const code = (await cookies()).get('plentovo-market')?.value || 'ZA';
  await ensureCommerce();
  const row = (await experiencePool().query("SELECT code,name,currency FROM commerce_markets WHERE code=$1 AND status='ACTIVE'", [code])).rows[0];
  return row ? {code: String(row.code), name: String(row.name), currency: String(row.currency)} : null;
 } catch { return null; }
});
export async function catalogueMarket() {
  // The existing supplier adapter serves ZA only. Other adapters must explicitly opt in.
  return (await selectedMarket())?.code === 'ZA';
}

import {Geist} from 'next/font/google';
import {redirect} from 'next/navigation';
import {commerceActor, CommerceError} from '@/lib/commerce/access';
import {permits} from '@/lib/commerce/domain';
import {operator, ExperienceError} from '@/lib/experience/access';
import type {Market} from '@/lib/back-office';
import {LiveBackOffice} from './live-back-office';

const geist = Geist({subsets: ['latin']});
export const metadata = {title: 'Back Office | Plentovo', robots: {index: false, follow: false}};

export default async function BackOfficePage({searchParams}: {searchParams: Promise<{view?: string}>}) {
  const results = await Promise.allSettled([operator(), commerceActor()]);
  const [operations, commerce] = results;
  const markets: Market[] = [];
  if (operations.status === 'fulfilled') markets.push('ZA');
  if (commerce.status === 'fulfilled' && permits(commerce.value.admin, commerce.value.grants, 'TN')) markets.push('TN');
  if (!markets.length) {
    if (results.some(result => result.status === 'rejected'
      && (result.reason instanceof ExperienceError || result.reason instanceof CommerceError) && result.reason.status === 401)) {
      redirect('/login?callbackUrl=%2Foperations%2Fback-office');
    }
    const unavailable = results.some(result => result.status === 'rejected'
      && !(result.reason instanceof ExperienceError || result.reason instanceof CommerceError));
    return <main className="mx-auto max-w-xl p-10"><h1 className="text-2xl font-bold">Plentovo Back Office</h1>
      <p className="mt-3">{unavailable ? 'Back office access could not be checked. Refresh to try again.' : 'Your account needs access to an operations market.'}</p></main>;
  }
  const {view} = await searchParams;
  return <div className={geist.className}><LiveBackOffice key={view} markets={markets} view={view} /></div>;
}

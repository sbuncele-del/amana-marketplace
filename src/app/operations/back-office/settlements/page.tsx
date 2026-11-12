import {redirect} from 'next/navigation';
import {ExperienceError, operator} from '@/lib/experience/access';
import {BackOfficeSection} from '../section';
import {SellerSettlements} from './seller-settlements';

export const metadata = {title: 'Seller settlements | Plentovo', robots: {index: false, follow: false}};
export const dynamic = 'force-dynamic';

export default async function Page() {
  let admin = false;
  try {
    admin = (await operator()).admin;
  } catch (error) {
    if (error instanceof ExperienceError && error.status === 401) {
      redirect('/login?callbackUrl=%2Foperations%2Fback-office%2Fsettlements');
    }
  }
  return <BackOfficeSection active="Payments">
    <h2>Seller settlements</h2>
    {admin ? <SellerSettlements /> : <p>Administrator access is required to view seller settlements.</p>}
  </BackOfficeSection>;
}

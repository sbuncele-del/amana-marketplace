import {operator} from '@/lib/experience/access';
import {CommandCentre} from '@/components/experience/command-centre';
import {BackOfficeSection} from '../section';

export default async function CustomersPage() {
  try {
    await operator();
  } catch {
    return <BackOfficeSection active="Customers"><p className="mt-4">Customer care requires a staff account with customer operations access.</p></BackOfficeSection>;
  }
  return <BackOfficeSection active="Customers"><CommandCentre embedded /></BackOfficeSection>;
}

import {operator} from '@/lib/experience/access';
import {CommandCentre} from '@/components/experience/command-centre';
import {BackOfficeSection} from '../section';

export default async function SupportPage() {
  try {
    await operator();
  } catch {
    return <BackOfficeSection active="Support"><p className="mt-4">Sign in with a staff account that has customer operations access to view support cases.</p></BackOfficeSection>;
  }
  return <BackOfficeSection active="Support"><CommandCentre embedded supportOnly /></BackOfficeSection>;
}

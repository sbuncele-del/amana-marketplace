import {redirect} from 'next/navigation';
import {cookies} from 'next/headers';
export default async function Page(){const locale=(await cookies()).get('plentovo_tn_language')?.value;redirect('/'+(['en','fr','ar'].includes(locale||'')?locale:'en'))}

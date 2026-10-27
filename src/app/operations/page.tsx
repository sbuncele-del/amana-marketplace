import {redirect} from 'next/navigation';
import Link from 'next/link';
import {operator,ExperienceError} from '@/lib/experience/access';
import {CommandCentre} from '@/components/experience/command-centre';
export const metadata={title:'Experience Command Centre | Plentovo',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function OperationsPage(){try{await operator();}catch(e){if(e instanceof ExperienceError&&e.status===401)redirect('/login?callbackUrl=%2Foperations');return <main className="mx-auto max-w-xl px-6 py-24"><h1 className="text-2xl font-bold">Experience operations</h1><p className="mt-5 leading-7">{e instanceof ExperienceError?e.message:'The operations service is temporarily unavailable. Please try again shortly.'}</p><Link href="/experience-preview" className="mt-6 inline-block underline">Explore the design preview</Link><Link href="/" className="ml-6 underline">Return to the store</Link></main>;}return <><nav className="flex gap-5 bg-white p-4 text-sm lg:hidden" aria-label="Team workspaces"><Link href="/operations/store" className="text-red-700 underline">Store management</Link><Link href="/operations/commerce" className="underline">Markets & fulfilment</Link></nav><CommandCentre/></>;}

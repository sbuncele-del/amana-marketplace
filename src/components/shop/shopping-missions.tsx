import Link from 'next/link';
import Image from 'next/image';
import {ArrowRight} from 'lucide-react';
import {shoppingMissions} from '@/lib/shopping-missions';

export function ShoppingMissions({current}:{current?:string}){
 return <section aria-labelledby="shopping-missions-title" className="mx-auto max-w-[1800px] px-4 pt-7">
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#B91F25]">A little help choosing</p><h2 id="shopping-missions-title" className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{current?'Find your next useful idea':'What would make your everyday easier?'}</h2><p className="mt-2 text-sm text-gray-600">Start with what you need. Find good things that fit.</p></div><Link href="/browse" className="text-sm font-semibold text-red-700 underline underline-offset-4">Browse all products</Link></div>
  <div className="grid gap-4 md:grid-cols-3">{shoppingMissions.filter(m=>m.slug!==current).map(m=><Link key={m.slug} href={'/collections/'+m.slug} className="group flex overflow-hidden rounded-2xl border border-[#E9E4DD] bg-white transition hover:border-red-300 focus-visible:outline-2 focus-visible:outline-red-700">
   <div className="relative w-1/3 shrink-0 bg-[#EFE9DF]"><Image src={m.image} alt="" fill sizes="(max-width:768px) 30vw, 15vw" className="object-cover"/></div>
   <div className="flex flex-1 flex-col p-5"><h3 className="text-lg font-bold leading-tight">{m.shortTitle}</h3><p className="mt-2 text-xs leading-5 text-gray-600">{m.description}</p><span className="mt-5 inline-flex items-center gap-3 text-sm font-bold text-red-700">Help me choose<ArrowRight size={16}/></span></div>
  </Link>)}</div>
 </section>;
}

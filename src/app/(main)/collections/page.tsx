import type {Metadata} from 'next';
import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
import {shoppingMissions,missionSection} from '@/lib/shopping-missions';
import {MissionCard} from '@/components/shop/shopping-missions';

export const metadata:Metadata={title:'Shopping ideas for every room and routine',description:'Find useful Plentovo products by room, everyday need and budget. Explore bathroom, bedroom, dining, kitchen, home office, outdoor living and more.',alternates:{canonical:'/collections'}};
export default function CollectionsPage(){
 const sections=['Shop by room','Everyday life','Out and about'];
 return <main id="main-content" className="bg-[#F7F6F3] pb-14"><div className="mx-auto max-w-[1800px] px-4 pt-6">
  <nav aria-label="Breadcrumb" className="mb-6 text-xs text-gray-600"><Link href="/" className="underline">Home</Link><span className="mx-2">/</span>Shopping ideas</nav>
  <section className="rounded-2xl bg-[#EFE9DF] px-6 py-10 sm:px-10 lg:py-14"><p className="text-xs font-bold uppercase tracking-[.17em] text-red-700">Good things. Plenty of choice.</p><h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">Where could you use<br className="hidden sm:block"/> a little more ease?</h1><p className="mt-5 max-w-2xl text-base leading-7 text-gray-700">Start with a room, a routine or something you would like to make better. We will help you narrow the choices, with useful suggestions and a budget that suits you.</p><nav aria-label="Shopping idea sections" className="mt-6 flex flex-wrap gap-2">{sections.map((title,i)=><a href={'#ideas-'+i} key={title} className="rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-bold">{title}</a>)}</nav></section>
  {sections.map((title,i)=><section id={'ideas-'+i} key={title} aria-labelledby={'section-'+i} className="scroll-mt-48 pt-10"><h2 id={'section-'+i} className="text-2xl font-extrabold sm:text-3xl">{title}</h2><p className="mb-5 mt-2 text-sm text-gray-600">{i===0?'Make the spaces you use work around you.':i===1?'Useful starting points for the things you do every day.':'Find a little help for the plans ahead.'}</p><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{shoppingMissions.filter(m=>missionSection(m.slug)===title).map(m=><MissionCard key={m.slug} mission={m}/>)}</div></section>)}
  <section className="mt-10 flex flex-wrap items-center justify-between gap-5 rounded-2xl border bg-white p-6"><div><h2 className="text-xl font-bold">Already know what you want?</h2><p className="mt-2 text-sm text-gray-600">The full catalogue is here whenever you need it.</p></div><Link href="/browse" className="inline-flex items-center gap-3 rounded-lg bg-[#DA292B] px-5 py-3 text-sm font-bold text-white">Browse all products<ArrowRight size={16}/></Link></section>
 </div></main>;
}

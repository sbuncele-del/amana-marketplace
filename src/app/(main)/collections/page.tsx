import type {Metadata} from 'next';
import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
import {shoppingMissions,missionSection} from '@/lib/shopping-missions';
import {MissionCard} from '@/components/shop/shopping-missions';

export const metadata:Metadata={title:'Shopping ideas for every room and routine',description:'Find useful Plentovo products by room, everyday need and budget. Explore bathroom, bedroom, dining, kitchen, home office, outdoor living and more.',alternates:{canonical:'/collections'}};
export default function CollectionsPage(){
 const sections=['Shop by room','Everyday life','Out and about'];
 return <main id="main-content" className="bg-[#F7F6F3] pb-14"><div className="mx-auto max-w-[1800px] px-4 pt-4">
  <nav aria-label="Breadcrumb" className="mb-4 text-xs text-gray-600"><Link href="/" className="underline">Home</Link><span className="mx-2">/</span>Shopping ideas</nav>
  <h1 className="text-2xl font-extrabold sm:text-3xl">Shopping ideas for your everyday</h1>
  <nav aria-label="Shopping idea sections" className="mt-4 flex flex-wrap items-center gap-2 border-b border-[#E5E0D8] pb-4"><span className="mr-2 text-xs font-semibold text-gray-500">Find your starting point</span>{sections.map((title,i)=><a href={'#ideas-'+i} key={title} className="rounded-full border border-[#DED8CF] bg-white px-4 py-2.5 text-xs font-bold text-[#30383E] transition hover:border-red-300 hover:text-red-700">{title}</a>)}</nav>
  {sections.map((title,i)=><section id={'ideas-'+i} key={title} aria-labelledby={'section-'+i} className="scroll-mt-48 pt-7"><h2 id={'section-'+i} className="text-2xl font-extrabold sm:text-3xl">{title}</h2><p className="mb-5 mt-2 text-sm text-gray-600">{i===0?'Make the spaces you use work around you.':i===1?'Useful starting points for the things you do every day.':'Find a little help for the plans ahead.'}</p><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{shoppingMissions.filter(m=>missionSection(m.slug)===title).map(m=><MissionCard key={m.slug} mission={m}/>)}</div></section>)}
  <section className="mt-10 flex flex-wrap items-center justify-between gap-5 rounded-2xl border bg-white p-6"><div><h2 className="text-xl font-bold">Already know what you want?</h2><p className="mt-2 text-sm text-gray-600">The full catalogue is here whenever you need it.</p></div><Link href="/browse" className="inline-flex items-center gap-3 rounded-lg bg-[#DA292B] px-5 py-3 text-sm font-bold text-white">Browse all products<ArrowRight size={16}/></Link></section>
 </div></main>;
}

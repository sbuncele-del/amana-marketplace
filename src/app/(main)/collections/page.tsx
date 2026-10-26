import type {Metadata} from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {ArrowRight} from 'lucide-react';
import {shoppingMissions,missionSection} from '@/lib/shopping-missions';
import {MissionCard} from '@/components/shop/shopping-missions';

export const metadata:Metadata={title:'Shopping ideas for every room and routine',description:'Find useful Plentovo products by room, everyday need and budget. Explore bathroom, bedroom, dining, kitchen, home office, outdoor living and more.',alternates:{canonical:'/collections'}};
export default function CollectionsPage(){
 const sections=['Shop by room','Everyday life','Out and about'];
 return <main id="main-content" className="bg-[#F7F6F3] pb-14"><div className="mx-auto max-w-[1800px] px-4 pt-4">
  <nav aria-label="Breadcrumb" className="mb-4 text-xs text-gray-600"><Link href="/" className="underline">Home</Link><span className="mx-2">/</span>Shopping ideas</nav>
  <section aria-labelledby="ideas-hero-title" className="relative isolate overflow-hidden rounded-2xl bg-[#EDE6DB]">
   <div className="absolute inset-0 hidden md:block"><Image src="/brand/plentovo-living.webp" alt="" fill priority sizes="100vw" className="object-cover object-right"/><div className="absolute inset-0 bg-gradient-to-r from-[#F3EDE3] via-[#F3EDE3]/90 to-transparent lg:via-[#F3EDE3]/45"/></div>
   <div className="relative grid md:min-h-[330px] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:min-h-[380px]">
    <div className="relative z-10 px-6 pb-7 pt-8 sm:px-9 md:py-9 lg:px-12 lg:py-11">
     <p className="text-[11px] font-bold uppercase tracking-[.19em] text-[#B91F25]">Plentovo shopping ideas</p>
     <h1 id="ideas-hero-title" className="mt-4 text-[clamp(2.5rem,3.5vw,4rem)] font-extrabold leading-[1.02] tracking-[-.045em] text-[#171B20]">More room<br/>for good living.</h1>
     <p className="mt-4 max-w-sm text-sm leading-6 text-[#39434A] sm:text-base">Good finds for your home, your routines and your next adventure. Let’s find what fits your life.</p>
     <a href="#ideas-0" className="mt-5 inline-flex items-center gap-5 rounded-lg bg-[#DA292B] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#B91F25] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-700">Find ideas for your room<ArrowRight size={18}/></a>
    </div>
    <div className="relative aspect-[2/1] md:hidden"><Image src="/brand/plentovo-living.webp" alt="A warm living room with a cream sofa, oak table and green plants" fill priority sizes="100vw" className="object-cover object-right"/></div>
   </div>
   <div className="absolute bottom-5 right-6 hidden rounded-full border border-white/70 bg-white/90 px-4 py-2 text-xs font-semibold text-[#39434A] lg:block">Good things. Plenty of choice.</div>
  </section>
  <nav aria-label="Shopping idea sections" className="mt-4 flex flex-wrap items-center gap-2 border-b border-[#E5E0D8] pb-4"><span className="mr-2 text-xs font-semibold text-gray-500">Find your starting point</span>{sections.map((title,i)=><a href={'#ideas-'+i} key={title} className="rounded-full border border-[#DED8CF] bg-white px-4 py-2.5 text-xs font-bold text-[#30383E] transition hover:border-red-300 hover:text-red-700">{title}</a>)}</nav>
  {sections.map((title,i)=><section id={'ideas-'+i} key={title} aria-labelledby={'section-'+i} className="scroll-mt-48 pt-7"><h2 id={'section-'+i} className="text-2xl font-extrabold sm:text-3xl">{title}</h2><p className="mb-5 mt-2 text-sm text-gray-600">{i===0?'Make the spaces you use work around you.':i===1?'Useful starting points for the things you do every day.':'Find a little help for the plans ahead.'}</p><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{shoppingMissions.filter(m=>missionSection(m.slug)===title).map(m=><MissionCard key={m.slug} mission={m}/>)}</div></section>)}
  <section className="mt-10 flex flex-wrap items-center justify-between gap-5 rounded-2xl border bg-white p-6"><div><h2 className="text-xl font-bold">Already know what you want?</h2><p className="mt-2 text-sm text-gray-600">The full catalogue is here whenever you need it.</p></div><Link href="/browse" className="inline-flex items-center gap-3 rounded-lg bg-[#DA292B] px-5 py-3 text-sm font-bold text-white">Browse all products<ArrowRight size={16}/></Link></section>
 </div></main>;
}

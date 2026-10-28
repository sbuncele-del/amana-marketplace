import {SharedMissions} from '../../../packages/storefront/missions';
import Link from 'next/link';
import Image from 'next/image';
import {ArrowRight} from 'lucide-react';
import {shoppingMissions,missionSection,type ShoppingMission} from '@/lib/shopping-missions';

export function MissionCard({mission:m}:{mission:ShoppingMission}){
 return <Link href={'/collections/'+m.slug} className="group flex overflow-hidden rounded-2xl border border-[#E9E4DD] bg-white transition hover:border-red-300 focus-visible:outline-2 focus-visible:outline-red-700">
  <div className="relative w-1/3 shrink-0 bg-[#EFE9DF]"><Image unoptimized src={m.image} alt="" fill sizes="(max-width:768px) 30vw, 15vw" className="object-cover"/></div>
  <div className="flex flex-1 flex-col p-3 md:p-5"><h3 className="text-base md:text-lg font-bold leading-tight">{m.shortTitle}</h3><p className="mt-2 hidden text-xs leading-5 text-gray-600 md:block">{m.description}</p><span className="mt-3 md:mt-5 inline-flex items-center gap-3 text-sm font-bold text-red-700">Help me choose<ArrowRight size={16}/></span></div>
 </Link>;
}
export function ShoppingMissions({current,slugs}:{current?:string;slugs?:string[]}){
 const all=shoppingMissions.filter(m=>m.slug!==current);
 const ordered=current?[...all.filter(m=>missionSection(m.slug)===missionSection(current)),...all.filter(m=>missionSection(m.slug)!==missionSection(current))]:all;
 const visible=slugs?slugs.map(slug=>all.find(m=>m.slug===slug)).filter((m):m is ShoppingMission=>Boolean(m)):ordered.slice(0,current?3:6);
 return <SharedMissions missions={visible.map(m=>({slug:m.slug,href:'/collections/'+m.slug,image:m.image,title:m.shortTitle,description:m.description}))} eyebrow="A little help choosing" title={current?'Find your next useful idea':'What would make your everyday easier?'} text="Start with your room, your routine or your next adventure." action="Help me choose" allHref="/collections" allAction={`Explore all ${shoppingMissions.length} shopping ideas`}/>;
}

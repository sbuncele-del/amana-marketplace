'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {ArrowLeft,ArrowRight,Pause,Play} from 'lucide-react';

import {defaultSlides} from '@/lib/cms/defaults';
import type {StoreConfig} from '@/lib/cms/domain';

export function ShoppingSlideshow({slides=defaultSlides}:{slides?:StoreConfig['slides']}){
 const [active,setActive]=useState(0);
 const [paused,setPaused]=useState(false);
 const [hovered,setHovered]=useState(false);
 const [focused,setFocused]=useState(false);
 const [reduced,setReduced]=useState(true);
 const [visible,setVisible]=useState(true);
 const touchStart=useRef<number|null>(null);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const motion=()=>setReduced(media.matches);
  const visibility=()=>setVisible(!document.hidden);
  motion();visibility();
  media.addEventListener('change',motion);document.addEventListener('visibilitychange',visibility);
  return()=>{media.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 useEffect(()=>{
  if(paused||hovered||focused||reduced||!visible)return;
  const timer=window.setInterval(()=>setActive(i=>(i+1)%slides.length),6500);
  return()=>window.clearInterval(timer);
 },[active,paused,hovered,focused,reduced,visible]);
 function move(delta:number){setActive(i=>(i+delta+slides.length)%slides.length);}
 return <section aria-label="Shopping inspiration" aria-roledescription="carousel"
  onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
  onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setFocused(false);}}
  onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();move(1);}if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}}}
  onTouchStart={e=>{touchStart.current=e.touches[0].clientX;}}
  onTouchEnd={e=>{if(touchStart.current!==null){const distance=e.changedTouches[0].clientX-touchStart.current;if(Math.abs(distance)>50)move(distance<0?1:-1);}touchStart.current=null;}}
  className="relative mx-auto max-w-[1800px] overflow-hidden bg-[#EDE4D5]">
  {slides.map((slide,i)=><div key={slide.href} hidden={i!==active} role="group" aria-roledescription="slide" aria-label={`${i+1} of ${slides.length}`} className="relative">
   <div className="relative md:h-[clamp(340px,33.333vw,600px)]">
    <div className="absolute inset-0 hidden md:block">
     <Image unoptimized src={slide.image} alt="" fill priority={i===0} sizes="100vw" className="object-cover object-right"/>
     <div className="absolute inset-0 bg-gradient-to-r from-[#F7F1E7]/90 via-[#F7F1E7]/25 to-transparent"/>
    </div>
    <div className="relative z-10 px-5 py-7 sm:px-10 md:flex md:h-full md:w-[46%] md:flex-col md:justify-center md:pb-20 md:pt-8 lg:px-12">
     <p className="text-[10px] font-bold uppercase tracking-[.18em] text-red-700">Plentovo · Everyday possibilities</p>
     <h2 className="mt-3 max-w-xl text-3xl font-extrabold leading-[1.05] tracking-tight md:text-[clamp(1.75rem,3.1vw,3.5rem)]">{slide.title}</h2>
     <p className="mt-4 max-w-md text-sm leading-6 text-[#252E35] lg:text-base">{slide.text}</p>
     <Link href={slide.href} className="mt-5 inline-flex w-fit items-center gap-3 rounded-lg bg-[#DA292B] px-5 py-3 text-sm font-bold text-white hover:bg-[#B91F25]">{slide.action}<ArrowRight size={16}/></Link>
    </div>
    <Image unoptimized src={slide.image} alt="" width={2172} height={724} sizes="100vw" className="block h-auto w-full md:hidden"/>
   </div>
  </div>)}
  <div className="relative z-20 flex items-center justify-between gap-3 px-5 py-3 sm:px-10 md:absolute md:bottom-2 md:left-0 md:right-0">
   <div className="flex items-center rounded-full bg-white/95 px-1 py-1 sm:gap-1 sm:px-2">{slides.map((s,i)=><button key={s.href} type="button" aria-label={`Show slide ${i+1}: ${s.title}`} aria-pressed={i===active} onClick={()=>{setActive(i);}} className="flex h-8 w-5 sm:h-9 sm:w-6 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-red-700"><span className={`block h-2 rounded-full ${i===active?'w-4 bg-red-700':'w-2 bg-gray-400'}`}/></button>)}</div>
   <div className="flex gap-1 sm:gap-2">{[{label:'Previous slide',click:()=>move(-1),icon:ArrowLeft},{label:paused||reduced?'Play slideshow':'Pause slideshow',click:()=>{if(paused||reduced){setReduced(false);setPaused(false);}else setPaused(true);},icon:paused||reduced?Play:Pause},{label:'Next slide',click:()=>move(1),icon:ArrowRight}].map(c=><button key={c.label} type="button" aria-label={c.label} onClick={c.click} className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-[#171B20] hover:bg-white focus-visible:outline-2 focus-visible:outline-red-700"><c.icon size={17}/></button>)}</div>
  </div>
 </section>;
}

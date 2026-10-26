'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {ArrowLeft,ArrowRight,Pause,Play} from 'lucide-react';

const slides=[
 {title:'Good things. Plenty of choice.',text:'Make everyday cooking a little easier.',image:'/brand/plentovo-hero-v2.webp',href:'/collections/kitchen-made-easier',action:'Explore the kitchen'},
 {title:'More room for good living.',text:'Find your favourite place to unwind.',image:'/brand/plentovo-living.webp',href:'/collections/living-room',action:'Explore living room'},
 {title:'Make room to rest.',text:'Bedding, bedside essentials and a little more calm.',image:'/brand/categories/bedding-v1.webp',href:'/collections/bedroom',action:'Explore the bedroom'},
 {title:'Big ideas. Little adventures.',text:'Find something for their next moment of play.',image:'/brand/categories/toys-games-v1.webp',href:'/collections/kids-play',action:'Explore playtime'},
 {title:'Everyday, refreshed.',text:'Small changes for a bathroom that works around you.',image:'/brand/categories/personal-care-v1.webp',href:'/collections/bathroom',action:'Explore the bathroom'},
 {title:'A little care, every day.',text:'Make time for the routine that feels like you.',image:'/brand/categories/skincare-v1.webp',href:'/collections/beauty-routine',action:'Explore everyday care'},
 {title:'Good days start outside.',text:'Find useful things for fresh air and time together.',image:'/brand/categories/outdoor-play-v1.webp',href:'/collections/outdoor-living',action:'Explore outdoor living'}
];
export function ShoppingSlideshow(){
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
  {slides.map((slide,i)=>{
   const panoramic=i<2;
   return <div key={slide.href} hidden={i!==active} role="group" aria-roledescription="slide" aria-label={`${i+1} of ${slides.length}`} className="relative">
    <div className="relative md:h-[clamp(360px,32vw,540px)]">
     <div className={panoramic?'absolute inset-0 hidden md:block':'absolute inset-y-0 right-0 hidden w-[clamp(360px,32vw,540px)] md:block'}>
      <Image unoptimized src={slide.image} alt="" fill priority={i===0} sizes={panoramic?'100vw':'540px'} className="object-cover object-center"/>
     </div>
     {panoramic&&<div className="absolute inset-0 hidden bg-gradient-to-r from-[#F3EBDD]/95 via-[#F3EBDD]/40 to-transparent md:block"/>}
     <div className={'relative z-10 px-5 py-7 sm:px-10 md:flex md:h-full md:flex-col md:justify-center md:py-8 lg:px-12 '+(panoramic?'md:w-1/2':'md:w-[calc(100%_-_clamp(360px,32vw,540px))]')}>
      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-red-700">Plentovo · Everyday possibilities</p>
      <h2 className="mt-4 max-w-xl text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">{slide.title}</h2>
      <p className="mt-4 max-w-md text-sm leading-6 text-[#39434A] sm:text-base">{slide.text}</p>
      <Link href={slide.href} className="mt-5 inline-flex w-fit items-center gap-3 rounded-lg bg-[#DA292B] px-5 py-3 text-sm font-bold text-white hover:bg-[#B91F25]">{slide.action}<ArrowRight size={16}/></Link>
     </div>
     <Image unoptimized src={slide.image} alt="" width={panoramic?1800:1024} height={panoramic?600:1024} sizes="100vw" className="block h-auto w-full md:hidden"/>
    </div>
   </div>;
  })}
  <div className="relative z-20 flex items-center justify-between gap-3 border-t border-black/5 px-5 py-3 sm:px-10">
   <div className="flex items-center rounded-full bg-white/95 px-1 py-1 sm:gap-1 sm:px-2">{slides.map((s,i)=><button key={s.href} type="button" aria-label={`Show slide ${i+1}: ${s.title}`} aria-pressed={i===active} onClick={()=>{setActive(i);}} className="flex h-8 w-5 sm:h-9 sm:w-6 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-red-700"><span className={`block h-2 rounded-full ${i===active?'w-4 bg-red-700':'w-2 bg-gray-400'}`}/></button>)}</div>
   <div className="flex gap-1 sm:gap-2">{[{label:'Previous slide',click:()=>move(-1),icon:ArrowLeft},{label:paused||reduced?'Play slideshow':'Pause slideshow',click:()=>{if(paused||reduced){setReduced(false);setPaused(false);}else setPaused(true);},icon:paused||reduced?Play:Pause},{label:'Next slide',click:()=>move(1),icon:ArrowRight}].map(c=><button key={c.label} type="button" aria-label={c.label} onClick={c.click} className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-[#171B20] hover:bg-white focus-visible:outline-2 focus-visible:outline-red-700"><c.icon size={17}/></button>)}</div>
  </div>
 </section>;
}

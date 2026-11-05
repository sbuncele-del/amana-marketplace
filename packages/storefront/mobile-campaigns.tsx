'use client';
import Image from 'next/image';
import {useCallback,useEffect,useRef,useState} from 'react';

export type MobileCampaign={title:string;action:string;href:string;image:string;tone:'budget'|'kitchen'|'tech'};
export type CampaignLocale='en'|'fr'|'ar';
const labels={en:'Explore collections',fr:'Explorer les collections',ar:'استكشف المجموعات'};
export function mobileCampaigns(locale:CampaignLocale,market:'ZA'|'TN',images:Partial<Record<MobileCampaign['tone'],string>>={}):MobileCampaign[]{
 const tn=market==='TN',base=tn?`/tunisia/${locale}`:'',budget=tn?'50 DT':'R300';
 const action={en:'Shop collection',fr:'Voir la sélection',ar:'تسوق المجموعة'}[locale];
 const route=(slug:string)=>tn?`${base}/category/${slug}`:`/department/${slug}`;
 return [
  {tone:'budget',title:{en:`Good finds under ${budget}`,fr:`De belles trouvailles à moins de ${budget}`,ar:'اختيارات جميلة بأقل من 50 د.ت.'}[locale],action,href:tn?`${base}/shop?maxPrice=50`:'/browse?maxPrice=300',image:images.budget||`${base.startsWith('/tunisia')?'/tunisia':''}/brand/categories/organisation-v1.webp`},
  {tone:'kitchen',title:{en:'Make everyday cooking easier',fr:'Simplifiez la cuisine au quotidien',ar:'اجعل الطبخ اليومي أسهل'}[locale],action,href:route('kitchen-dining'),image:images.kitchen||`${tn?'/tunisia':''}/brand/categories/cookware-v1.webp`},
  {tone:'tech',title:{en:'Small tech. More possibilities.',fr:'Des accessoires qui simplifient la vie',ar:'تقنيات صغيرة بإمكانات أكبر'}[locale],action,href:route('electronics'),image:images.tech||`${tn?'/tunisia':''}/brand/categories/audio-v1.webp`},
 ];
}

export function MobileCampaignCarousel({slides,locale}:{slides:MobileCampaign[];locale:CampaignLocale}){
 const track=useRef<HTMLDivElement>(null);
 const [active,setActive]=useState(0);
 const [paused,setPaused]=useState(false);
 const [interacting,setInteracting]=useState(false);
 const [visible,setVisible]=useState(false);
 const [reducedMotion,setReducedMotion]=useState(true);
 const [pageVisible,setPageVisible]=useState(true);
 const controls={en:['Pause slides','Play slides'],fr:['Mettre en pause','Relancer le défilement'],ar:['إيقاف الشرائح مؤقتًا','تشغيل الشرائح']}[locale];
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const motion=()=>setReducedMotion(media.matches);
  const visibility=()=>setPageVisible(!document.hidden);
  motion();visibility();
  media.addEventListener('change',motion);document.addEventListener('visibilitychange',visibility);
  const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(([entry])=>setVisible(entry.intersectionRatio>=0.5),{threshold:0.5});
  if(track.current&&observer)observer.observe(track.current);
  return()=>{observer?.disconnect();media.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 const goTo=useCallback((index:number,behavior:ScrollBehavior)=>{
  const container=track.current,slide=container?.children[index];
  if(!container||!slide)return;
  container.scrollBy({left:slide.getBoundingClientRect().left-container.getBoundingClientRect().left,behavior});
 },[]);
 useEffect(()=>{
  if(!visible||!pageVisible||paused||interacting||reducedMotion||slides.length<2)return;
  const timer=window.setTimeout(()=>goTo((active+1)%slides.length,active===slides.length-1?'instant':'smooth'),4500);
  return()=>window.clearTimeout(timer);
 },[active,goTo,interacting,pageVisible,paused,reducedMotion,slides.length,visible]);
 return <section className="mobile-campaign" aria-label={labels[locale]} dir={locale==='ar'?'rtl':'ltr'}
  onFocusCapture={e=>setInteracting(e.target.matches(':focus-visible'))} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setInteracting(false);}}>
  <div className="mobile-campaign-track" ref={track} onPointerDown={()=>setPaused(true)} onScroll={event=>{
   const container=event.currentTarget;
   const start=container.getBoundingClientRect().left;
   let closest=0,distance=Infinity;
   Array.from(container.children).forEach((slide,i)=>{const offset=Math.abs(slide.getBoundingClientRect().left-start);if(offset<distance){closest=i;distance=offset;}});
   setActive(closest);
  }}>
   {slides.map(slide=><a className={`mobile-campaign-slide mobile-campaign-${slide.tone}`} href={slide.href} key={slide.tone}>
    <Image src={slide.image} alt="" fill sizes="(max-width: 639px) 100vw, 639px" unoptimized/>
    <div><strong>{slide.title}</strong><span>{slide.action} <span aria-hidden="true">{locale==='ar'?'←':'→'}</span></span></div>
   </a>)}
  </div>
  <div className="mobile-campaign-dots" role="group" aria-label={labels[locale]}>
   {slides.map((slide,i)=><button key={slide.tone} type="button" aria-label={slide.title} aria-current={i===active?'true':undefined} onClick={()=>{setPaused(true);goTo(i,reducedMotion?'instant':'smooth');}}/>)}
   {!reducedMotion&&<button type="button" className="mobile-campaign-play" aria-label={controls[paused?1:0]} onClick={()=>setPaused(!paused)}>{paused?'▶':'Ⅱ'}</button>}
  </div>
 </section>;
}

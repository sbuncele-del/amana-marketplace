'use client';
import Image from 'next/image';
import {Package,Tag} from 'lucide-react';
import {useCallback,useEffect,useRef,useState} from 'react';

export type MobileCampaign={title:string;action:string;href:string;image:string;tone:'budget'|'kitchen'|'tech'};
export type CampaignLocale='en'|'fr'|'ar';
const labels={en:'Explore collections',fr:'Explorer les collections',ar:'استكشف المجموعات'};
export function mobileCampaigns(locale:CampaignLocale,market:'ZA'|'TN',images:Partial<Record<MobileCampaign['tone'],string>>={}):MobileCampaign[]{
 const tn=market==='TN',base=tn?`/tunisia/${locale}`:'',budget=tn?'50 DT':'R300';
 const action={en:'Shop now',fr:'Achetez maintenant',ar:'تسوق الآن'}[locale];
 const route=(slug:string)=>tn?`${base}/category/${slug}`:`/department/${slug}`;
 return [
  {tone:'budget',title:{en:`Good finds under ${budget}`,fr:`Craquez à moins de ${budget}`,ar:'اختيارات جميلة بأقل من 50 د.ت.'}[locale],action,href:tn?`${base}/shop?maxPrice=50`:'/browse?maxPrice=300',image:`${tn?'/tunisia':''}/brand/campaigns/mobile-budget.webp`},
  {tone:'kitchen',title:{en:'Upgrade your kitchen today',fr:'Équipez votre cuisine dès aujourd’hui',ar:'جدّد مطبخك اليوم'}[locale],action,href:route('kitchen-dining'),image:images.kitchen||`${tn?'/tunisia':''}/brand/categories/cookware-v1.webp`},
  {tone:'tech',title:{en:'Grab your next tech upgrade',fr:'Trouvez votre prochain accessoire tech',ar:'اختر جهازك التقني الجديد'}[locale],action,href:route('electronics'),image:images.tech||`${tn?'/tunisia':''}/brand/categories/audio-v1.webp`},
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

const shortcutCopy={
 en:{all:'All',budget:'Under',stock:'In stock',label:'Shop by price or availability'},
 fr:{all:'Tout',budget:'Moins de',stock:'En stock',label:'Par prix ou disponibilité'},
 ar:{all:'الكل',budget:'أقل من',stock:'متوفر',label:'تسوق حسب السعر أو التوفر'},
};
export function MobileCampaignShortcuts({market,locale}:{market:'ZA'|'TN';locale:CampaignLocale}){
 const c=shortcutCopy[locale],tn=market==='TN',browse=tn?`/tunisia/${locale}/shop`:'/browse';
 const budget=tn?(locale==='ar'?'50 د.ت.':'50 DT'):'R300';
 return <nav className="mobile-campaign-shortcuts" aria-label={c.label} dir={locale==='ar'?'rtl':'ltr'}>
  <span aria-current="page">{c.all}</span>
  <a href={`${browse}?maxPrice=${tn?50:300}`}><Tag size={17} aria-hidden="true"/> {c.budget} {budget}</a>
  <a href={`${browse}?available=true`}><Package size={18} aria-hidden="true"/> {c.stock}</a>
 </nav>;
}

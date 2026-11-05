'use client';
import Image from 'next/image';
import {useRef,useState} from 'react';

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
 return <section className="mobile-campaign" aria-label={labels[locale]} dir={locale==='ar'?'rtl':'ltr'}>
  <div className="mobile-campaign-track" ref={track} onScroll={event=>{
   const container=event.currentTarget;
   const start=container.getBoundingClientRect().left;
   let closest=0,distance=Infinity;
   Array.from(container.children).forEach((slide,i)=>{const offset=Math.abs(slide.getBoundingClientRect().left-start);if(offset<distance){closest=i;distance=offset;}});
   setActive(closest);
  }}>
   {slides.map(slide=><a className={`mobile-campaign-slide mobile-campaign-${slide.tone}`} href={slide.href} key={slide.tone}>
    <div><strong>{slide.title}</strong><span>{slide.action} <span aria-hidden="true">{locale==='ar'?'←':'→'}</span></span></div>
    <Image src={slide.image} alt="" width={320} height={240} sizes="45vw" unoptimized/>
   </a>)}
  </div>
  <div className="mobile-campaign-dots" role="group" aria-label={labels[locale]}>
   {slides.map((slide,i)=><button key={slide.tone} type="button" aria-label={slide.title} aria-current={i===active?'true':undefined} onClick={()=>track.current?.children[i]?.scrollIntoView({block:'nearest',inline:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}/>)}
  </div>
 </section>;
}

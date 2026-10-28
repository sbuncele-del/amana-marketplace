'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Pause,Play,Truck,CheckCircle2,Banknote} from 'lucide-react';
import {messages} from '@/lib/messages';
import {copy,homeSlides,homeMissions,featuredMissions,departmentIdeas,discoveryGroups,productRows,matchesCategory} from '@/lib/storefront-copy';
import {money,type Locale} from '@/lib/catalogue';
import type {ProductGroup} from '@/lib/product-groups';
import {ProductCards} from './product-cards';
const asset=(p:string)=>'/tunisia/brand/'+p;
export function StorefrontHome({locale,groups,onAdd,collections=false}:{locale:Locale;groups:ProductGroup[];onAdd:(id:string)=>void;collections?:boolean}){
 const t=messages[locale],url=(key:string)=>`/${locale}/shop?q=${encodeURIComponent(key)}`;
 const [active,setActive]=useState(0),[paused,setPaused]=useState(false),[hovered,setHovered]=useState(false),[focused,setFocused]=useState(false),[reduced,setReduced]=useState(true),[visible,setVisible]=useState(true);
 const touch=useRef<number|null>(null);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const motion=()=>setReduced(media.matches),visibility=()=>setVisible(!document.hidden);motion();visibility();media.addEventListener('change',motion);document.addEventListener('visibilitychange',visibility);return()=>{media.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility)}},[]);
 useEffect(()=>{if(paused||hovered||focused||reduced||!visible)return;const timer=setInterval(()=>setActive(i=>(i+1)%homeSlides.length),6500);return()=>clearInterval(timer)},[active,paused,hovered,focused,reduced,visible]);
 const move=(delta:number)=>setActive(i=>(i+delta+homeSlides.length)%homeSlides.length);
 const missions=collections?homeMissions:featuredMissions.map(slug=>homeMissions.find(m=>m.slug===slug)!);
 const stocked=groups.filter(g=>g.stock>0);
 const row=(title:string,text:string,pool:ProductGroup[],href:string)=>pool.length>0?<section className="range" key={title}><div className="section-heading"><div><h2>{title}</h2>{text&&<p>{text}</p>}</div><Link prefetch={false} href={href}>{copy.explore[locale]} <ArrowRight size={16}/></Link></div><ProductCards groups={pool.slice(0,6)} locale={locale} onAdd={onAdd}/></section>:null;
 return <>
 {!collections&&<section className="slideshow" aria-roledescription="carousel" aria-label={copy.collections[locale]} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setFocused(false)}} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();move(1)}if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}}} onTouchStart={e=>{touch.current=e.touches[0].clientX}} onTouchEnd={e=>{if(touch.current!==null){const delta=e.changedTouches[0].clientX-touch.current;if(Math.abs(delta)>50)move(delta<0?1:-1)}touch.current=null}}>
 {homeSlides.map((slide,i)=><div className="slide" hidden={i!==active} key={slide.category} role="group" aria-roledescription="slide" aria-label={`${i+1} / ${homeSlides.length}`}><img src={asset(slide.image)} alt="" fetchPriority={i===0?'high':'auto'} loading={i===0?'eager':'lazy'}/><div className="slide-copy"><span className="eyebrow">{copy.eyebrow[locale]}</span><h2>{slide.title[locale]}</h2><p>{slide.text[locale]}</p><Link prefetch={false} className="button" href={url(slide.category)}>{slide.action[locale]}<ArrowRight size={16}/></Link></div></div>)}
 <div className="slide-controls"><div className="dots">{homeSlides.map((s,i)=><button key={s.category} aria-label={s.title[locale]} aria-pressed={i===active} onClick={()=>setActive(i)}><span/></button>)}</div><div className="arrows"><button aria-label={locale==='fr'?'Diapositive précédente':locale==='ar'?'الشريحة السابقة':'Previous slide'} onClick={()=>move(-1)}><ArrowLeft size={17}/></button><button aria-label={paused||reduced?(locale==='fr'?'Lecture':locale==='ar'?'تشغيل':'Play slideshow'):(locale==='fr'?'Pause':locale==='ar'?'إيقاف مؤقت':'Pause slideshow')} onClick={()=>{if(paused||reduced){setReduced(false);setPaused(false)}else setPaused(true)}}>{paused||reduced?<Play size={17}/>:<Pause size={17}/>}</button><button aria-label={locale==='fr'?'Diapositive suivante':locale==='ar'?'الشريحة التالية':'Next slide'} onClick={()=>move(1)}><ArrowRight size={17}/></button></div></div>
 </section>}
 <section className="shopping-ideas"><div className="section-heading"><div><span className="eyebrow">{t.ideasEyebrow}</span><h2>{t.ideasTitle}</h2><p>{t.ideasText}</p></div>{!collections&&<Link prefetch={false} href={`/${locale}/collections`}>{copy.allIdeas[locale]} <ArrowRight size={16}/></Link>}</div><div className="mission-grid">{missions.map(m=><Link prefetch={false} className="mission" href={url(m.key)} key={m.slug}><img src={m.image} alt="" loading="lazy"/><div><h3>{m.title[locale]}</h3><p>{m.description[locale]}</p><strong>{copy.choose[locale]} <ArrowRight size={16}/></strong></div></Link>)}</div></section>
 {!collections&&<>
 {row(copy.featured[locale],'',stocked,`/${locale}/shop`)}
 <section className="discovery-grid" aria-label={copy.departments[locale]}>{discoveryGroups.map(g=><article className="department" key={g.key}><h2>{g.title[locale]}</h2><p>{g.text[locale]}</p><div>{g.items.map(key=>{const item=departmentIdeas.find(c=>c.key===key)!;return <Link prefetch={false} href={url(key)} key={key}><img src={asset(item.image)} alt="" loading="lazy"/><span>{item.title[locale]}</span></Link>})}</div><Link prefetch={false} className="department-action" href={url(g.key)}>{g.action[locale]}<ArrowRight size={15}/></Link></article>)}</section>
 {row((locale==='fr'?'De belles trouvailles à moins de 50 DT':locale==='ar'?'اختيارات جميلة بأقل من 50 د.ت':'Good finds under 50 DT'),'',stocked.filter(g=>g.priceMillimes<50000),`/${locale}/shop?maxPrice=50`)}
 {productRows.map(spec=>row(spec.title[locale],spec.text[locale],stocked.filter(g=>matchesCategory(g,spec.key)),url(spec.key)))}
 <section className="budgets"><h2>{copy.budgetTitle[locale]}</h2><div>{[25,50,100].map((amount,i)=><Link prefetch={false} key={amount} href={`/${locale}/shop?maxPrice=${amount}`}><p>{copy.under[locale]}</p><h3>{money(amount*1000,locale)}</h3><p>{(locale==='fr'?['De petits ajouts à votre quotidien.','Des essentiels utiles. De nouvelles possibilités.','Plus de place pour ce que vous aimez.']:locale==='ar'?['إضافات صغيرة لحياتك اليومية.','أساسيات مفيدة وإمكانيات جديدة.','مساحة أكبر لما تحب.']:['Little additions to your everyday.','Useful essentials. Fresh possibilities.','More room for something you love.'])[i]}</p><strong>{copy.explore[locale]}<ArrowRight size={17}/></strong></Link>)}</div></section>
 <section className="benefits">{[{Icon:Truck,title:t.delivery,text:t.deliveryText},{Icon:CheckCircle2,title:t.confirmation,text:t.confirmationText},{Icon:Banknote,title:t.payment,text:t.paymentText}].map(({Icon,title,text})=><Link prefetch={false} href={`/${locale}/help`} key={title}><Icon/><h3>{title}</h3><p>{text}</p></Link>)}</section>
 </>}
 </>;
}

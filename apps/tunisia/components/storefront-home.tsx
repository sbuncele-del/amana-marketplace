'use client';
import {useCallback} from 'react';
import {mobileOpeningPicks} from '../../../packages/storefront/mobile-opening-picks';
import {mobileCampaigns} from '../../../packages/storefront/mobile-campaigns';
import {MobileShoppingFeed} from '../../../packages/storefront/mobile-shopping';
import {primaryDepartment} from '@/lib/catalogue-browse';
import {storefrontDepartments} from '../../../packages/storefront/departments';
import {StorefrontLayout,defaultBudgets,defaultHelp} from '../../../packages/storefront/home';
import {discoveryGroups as rsaDiscovery} from '../../../packages/storefront/discovery';
import {SharedSlideshow} from '../../../packages/storefront/slideshow';
import {SharedMissions} from '../../../packages/storefront/missions';
import {SharedMoreDepartments,moreGroups} from '../../../packages/storefront/more-departments';
import {storefrontSectionOrder} from '../../../packages/storefront/config';
import {messages} from '@/lib/messages';
import {copy,homeSlides,homeMissions,featuredMissions,productRows,matchesCategory} from '@/lib/storefront-copy';
import {storefrontTranslator} from '@/lib/storefront-locale';
import {money,type Locale} from '@/lib/catalogue';
import type {ProductGroup} from '@/lib/product-groups';
import {ProductCard} from './product-cards';
const categoryKeys:Record<string,string>={'kitchen-dining':'kitchen','home-living':'home','toys-kids-baby':'kids','health-beauty':'care','storage-organisation':'organisation','garden-outdoor':'outdoor','home-decor-gifts':'decor','furniture':'furniture'};
const mobileBanners=[
 {title:{en:'Good finds. Your budget.',fr:'De belles trouvailles. Votre budget.',ar:'اختيارات جميلة تناسب ميزانيتك.'},text:{en:'Useful finds under 50 DT.',fr:'Des trouvailles utiles à moins de 50 DT.',ar:'منتجات مفيدة بأقل من 50 د.ت.'},path:'shop?maxPrice=50'},
 {title:{en:'Make everyday cooking easier',fr:'Simplifiez la cuisine au quotidien',ar:'اجعل الطبخ اليومي أسهل'},text:{en:'Tools for prepping, cooking and serving.',fr:'Des ustensiles pour préparer, cuisiner et servir.',ar:'أدوات للتحضير والطبخ والتقديم.'},path:'category/kitchen-dining'},
 {title:{en:'Small tech. More possibilities.',fr:'Des accessoires qui simplifient la vie',ar:'تقنيات صغيرة بإمكانات أكبر'},text:{en:'Discover everyday electronics.',fr:'Découvrez les accessoires électroniques du quotidien.',ar:'اكتشف إلكترونيات الاستخدام اليومي.'},path:'category/electronics'},
 {title:{en:'Make room for play',fr:'Place au jeu',ar:'وقت للعب'},text:{en:'Find their next favourite toy or game.',fr:'Trouvez leur prochain jouet préféré.',ar:'اكتشف لعبتهم المفضلة القادمة.'},path:'category/toys-kids-baby'},
 {title:{en:'A little everyday care',fr:'Prenez soin de vous au quotidien',ar:'عناية كل يوم'},text:{en:'Essentials for your daily routine.',fr:'Les essentiels de votre routine.',ar:'أساسيات روتينك اليومي.'},path:'category/health-beauty'},
] as const;
function MobileHome({locale}:{locale:Locale}){
 const t=storefrontTranslator(locale);
 const load=useCallback(async(category:string,page:number,signal:AbortSignal)=>{
  const query=new URLSearchParams({category,page:String(page)});
  const response=await fetch('/tunisia/api/catalogue?'+query,{signal});
  if(!response.ok)throw new Error('Catalogue unavailable');
  const data=await response.json() as {products:ProductGroup[];hasNextPage:boolean};
  if(!category&&page===1){
   try{const recent=JSON.parse(sessionStorage.getItem('plentovo:recent-categories:v1:TND')||'[]');if(Array.isArray(recent))data.products.sort((a,b)=>Number(recent.includes(primaryDepartment(b)))-Number(recent.includes(primaryDepartment(a))));}catch{}
  }
  if(!category&&page===1)data.products=mobileOpeningPicks(data.products,p=>({title:Object.values(p.title).join(' '),category:primaryDepartment(p),available:p.stock>0,image:p.image,price:p.priceMillimes}),50000);
  return data;
 },[]);
 return <MobileShoppingFeed market="TN" campaigns={products=>mobileCampaigns(locale,'TN',{
  kitchen:products.find(p=>primaryDepartment(p)==='kitchen-dining'&&p.image)?.image,
  tech:products.find(p=>primaryDepartment(p)==='electronics'&&p.image)?.image,
 })} promotions={mobileBanners.map(b=>({title:b.title[locale],text:b.text[locale],action:locale==='fr'?'Achetez maintenant':locale==='ar'?'تسوق الآن':'Shop now',href:`/tunisia/${locale}/${b.path}`}))} locale={locale} categories={storefrontDepartments.map(d=>({slug:d.slug,name:t(d.name)}))} load={load} renderProduct={g=><ProductCard group={g} locale={locale}/>}/>;
}
export function StorefrontHome({locale,groups,collections=false}:{locale:Locale;groups:ProductGroup[];onAdd?:(id:string)=>void;collections?:boolean}){
 const t=storefrontTranslator(locale),m=messages[locale];
 const shop=(key:string)=>`/${locale}/shop?q=${encodeURIComponent(categoryKeys[key]||key)}`;
 const route=(href:string)=>href.startsWith('/department/')?(slug=>categoryKeys[slug]?`/${locale}/category/${slug}`:shop(slug))(href.split('/').pop()!):href.startsWith('/collections/')?shop(homeMissions.find(m=>href.endsWith(m.slug))?.key||'home'):`/${locale}/help`;
 const asset=(image:string)=>image.startsWith('/brand/')?'/tunisia'+image:image;
 const stocked=groups.filter(g=>g.stock>0);
 const missions=collections?homeMissions:featuredMissions.map(slug=>homeMissions.find(m=>m.slug===slug)!);
 const missionSection=<SharedMissions missions={missions.map(m=>({slug:m.slug,href:shop(m.key),image:m.image,title:m.title[locale],description:m.description[locale]}))} eyebrow={m.ideasEyebrow} title={m.ideasTitle} text={m.ideasText} action={copy.choose[locale]} allHref={`/${locale}/collections`} allAction={copy.allIdeas[locale]}/>;
 if(collections)return <main id="main-content" className="store-theme pb-14"><h1 className="sr-only">{copy.collections[locale]}</h1>{missionSection}</main>;
 const more=moreGroups.map(g=>({...g,title:t(g.title),subtitle:t(g.subtitle),action:t(g.action),href:route(g.href),items:g.items.map(i=>({...i,label:t(i.label),href:route(i.href)}))}));
 const discovery=rsaDiscovery.map(g=>({...g,title:t(g.title),subtitle:t(g.subtitle),action:t(g.action),href:route(g.href),items:g.items.map(i=>({...i,label:t(i.label),image:asset(i.image),href:route('/department/'+i.department)}))}));
 const budgets=defaultBudgets.map((b,i)=>({...b,amount:[25,50,100][i],label:money([25,50,100][i]*1000,locale),href:`/${locale}/shop?maxPrice=${[25,50,100][i]}`,text:t(b.text)}));
 // Country data fills the approved RSA positions. Do not invent a featured row or a demand claim.
 return <><MobileHome locale={locale}/><div className="desktop-storefront"><StorefrontLayout store={{sectionOrder:[...storefrontSectionOrder],hiddenSections:[],featuredTitle:copy.featured[locale]}} theme={{background:'#FAF8F5',accent:'#DA292B'}} title={'Plentovo — '+m.footer} slideshow={<SharedSlideshow t={t} slides={homeSlides.map(s=>({title:s.title[locale],text:s.text[locale],action:s.action[locale],image:asset('/brand/'+s.image),href:shop(s.category)}))}/>} missions={missionSection} more={<SharedMoreDepartments groups={more} t={t} allHref={`/${locale}/shop`}/>} discovery={discovery} demandProducts={[]} featuredProducts={[]} valueProducts={stocked.filter(g=>g.priceMillimes<50000).slice(0,6)} valueTitle={locale==='fr'?'De belles trouvailles à moins de 50 DT':locale==='ar'?'اختيارات جميلة بأقل من 50 د.ت':'Good finds under 50 DT'} valueHref={`/${locale}/shop?maxPrice=50`} collections={productRows.map(s=>({slug:s.key,title:s.title[locale],text:s.text[locale],href:shop(s.key),products:stocked.filter(g=>matchesCategory(g,s.key)).slice(0,6)}))} renderProduct={g=><ProductCard group={g} locale={locale}/>} budgets={budgets} help={defaultHelp.map((h,i)=>({...h,title:t(h.title),text:i===1?m.confirmationText:t(h.text),href:`/${locale}/help#${['delivery','confirmation','contact'][i]}`}))} t={t}/></div></>;
}

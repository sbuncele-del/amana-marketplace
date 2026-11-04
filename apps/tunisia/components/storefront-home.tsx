'use client';
import {useCallback} from 'react';
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
function MobileHome({groups,locale}:{groups:ProductGroup[];locale:Locale}){
 const t=storefrontTranslator(locale);
 const load=useCallback(async(category:string,page:number,signal:AbortSignal)=>{signal.throwIfAborted();let filtered=groups.filter(g=>g.image&&g.priceMillimes>0&&(!category||primaryDepartment(g)===category));if(!category){try{const recent=JSON.parse(sessionStorage.getItem('plentovo:recent-categories:v1:TND')||'[]');if(Array.isArray(recent))filtered=[...filtered].sort((a,b)=>Number(recent.includes(primaryDepartment(b)))-Number(recent.includes(primaryDepartment(a))));}catch{}}return {products:filtered.slice((page-1)*24,page*24),hasNextPage:page*24<filtered.length};},[groups]);
 return <MobileShoppingFeed promotions={[{title:locale==='fr'?'De belles trouvailles. Votre budget.':locale==='ar'?'اختيارات جميلة تناسب ميزانيتك.':'Good finds. Your budget.',text:locale==='fr'?'Des trouvailles utiles à moins de 50 DT.':locale==='ar'?'منتجات مفيدة بأقل من 50 د.ت.':'Useful finds under 50 DT.',action:locale==='fr'?'Explorer':locale==='ar'?'تسوق الآن':'Explore',href:`/tunisia/${locale}/shop?maxPrice=50`}]} locale={locale} categories={storefrontDepartments.map(d=>({slug:d.slug,name:t(d.name)}))} load={load} renderProduct={g=><ProductCard group={g} locale={locale}/>}/>;
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
 return <><MobileHome groups={groups} locale={locale}/><div className="desktop-storefront"><StorefrontLayout store={{sectionOrder:[...storefrontSectionOrder],hiddenSections:[],featuredTitle:copy.featured[locale]}} theme={{background:'#FAF8F5',accent:'#DA292B'}} title={'Plentovo — '+m.footer} slideshow={<SharedSlideshow t={t} slides={homeSlides.map(s=>({title:s.title[locale],text:s.text[locale],action:s.action[locale],image:asset('/brand/'+s.image),href:shop(s.category)}))}/>} missions={missionSection} more={<SharedMoreDepartments groups={more} t={t} allHref={`/${locale}/shop`}/>} discovery={discovery} demandProducts={[]} featuredProducts={[]} valueProducts={stocked.filter(g=>g.priceMillimes<50000).slice(0,6)} valueTitle={locale==='fr'?'De belles trouvailles à moins de 50 DT':locale==='ar'?'اختيارات جميلة بأقل من 50 د.ت':'Good finds under 50 DT'} valueHref={`/${locale}/shop?maxPrice=50`} collections={productRows.map(s=>({slug:s.key,title:s.title[locale],text:s.text[locale],href:shop(s.key),products:stocked.filter(g=>matchesCategory(g,s.key)).slice(0,6)}))} renderProduct={g=><ProductCard group={g} locale={locale}/>} budgets={budgets} help={defaultHelp.map((h,i)=>({...h,title:t(h.title),text:i===1?m.confirmationText:t(h.text),href:`/${locale}/help#${['delivery','confirmation','contact'][i]}`}))} t={t}/></div></>;
}

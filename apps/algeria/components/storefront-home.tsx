'use client';
import Link from 'next/link';
import {StorefrontLayout,defaultHelp} from '../../../packages/storefront/home';
import {storefrontSectionOrder} from '../../../packages/storefront/config';
import {SharedSlideshow} from '../../../packages/storefront/slideshow';
import {SharedMissions} from '../../../packages/storefront/missions';
import {SharedMoreDepartments,moreGroups} from '../../../packages/storefront/more-departments';
import {discoveryGroups} from '../../../packages/storefront/discovery';
import {homeSlides,homeMissions,featuredMissions,productRows,matchesCategory,copy} from '../../tunisia/lib/storefront-copy';
import {storefrontTranslator} from '../../tunisia/lib/storefront-locale';
import {money,type Product,type Locale} from '@/lib/catalogue';
import {messages} from '@/lib/messages';

// Share presentation and approved content, never another country's catalogue or prices.
export function AlgeriaStorefrontHome({locale,products}:{locale:Locale;products:Product[]}){
 const t=storefrontTranslator(locale),m=messages[locale];
 const shop=(key='')=>`/${locale}/shop${key?'?q='+encodeURIComponent(key):''}`;
 const image=(url:string)=>url.replace(/^\/(?:tunisia\/)?brand\//,'/algeria/brand/');
 const categoryKeys:Record<string,string>={'kitchen-dining':'kitchen','home-living':'home','toys-kids-baby':'kids','health-beauty':'care','storage-organisation':'organisation','garden-outdoor':'outdoor','home-decor-gifts':'decor'};
 const route=(href:string)=>{const slug=href.split('/').pop()||'';return shop(homeMissions.find(m=>m.slug===slug)?.key||categoryKeys[slug]||slug);};
 const stocked=products.filter(p=>p.stock>0&&p.image&&p.priceCentimes>0);
 const missions=featuredMissions.map(slug=>homeMissions.find(m=>m.slug===slug)!).filter(Boolean);
 const more=moreGroups.map(g=>({...g,title:t(g.title),subtitle:t(g.subtitle),action:t(g.action),href:route(g.href),items:g.items.map(i=>({...i,label:t(i.label),image:image(i.image),href:route(i.href)}))}));
 const discovery=discoveryGroups.map(g=>({...g,title:t(g.title),subtitle:t(g.subtitle),action:t(g.action),href:route(g.href),items:g.items.map(i=>({...i,label:t(i.label),image:image(i.image),href:shop(categoryKeys[i.department]||i.department)}))}));
 return <div className="dz-desktop-home"><StorefrontLayout store={{sectionOrder:[...storefrontSectionOrder],hiddenSections:['value','budgets'],featuredTitle:copy.featured[locale]}} theme={{background:'#FAF8F5',accent:'#DA292B'}} title={'Plentovo — '+m.footer}
 slideshow={<SharedSlideshow t={t} slides={homeSlides.map(s=>({title:s.title[locale],text:s.text[locale],action:s.action[locale],image:image('/brand/'+s.image),href:shop(s.category)}))}/>}
 missions={<SharedMissions missions={missions.map(m=>({slug:m.slug,title:m.title[locale],description:m.description[locale],image:image(m.image),href:shop(m.key)}))} eyebrow={m.ideasEyebrow} title={m.ideasTitle} text={m.ideasText} action={copy.choose[locale]} allHref={shop()} allAction={m.all}/>}
 more={<SharedMoreDepartments groups={more} t={t} allHref={shop()}/>} discovery={discovery} demandProducts={[]} featuredProducts={[]} valueProducts={[]} collections={productRows.map(row=>({slug:row.key,title:row.title[locale],text:row.text[locale],href:shop(row.key),products:stocked.filter(p=>matchesCategory(p,row.key)).slice(0,6)}))}
 renderProduct={p=><article className="dz-home-product"><Link href={`/${locale}/product/${p.slug}`}><img src={p.image} alt={p.title[locale]} loading="lazy"/><h3>{p.title[locale]}</h3><strong>{money(p.priceCentimes,locale)}</strong></Link></article>}
 help={defaultHelp.map((h,i)=>({...h,title:t(h.title),text:i===1?m.confirmationText:t(h.text),href:`/${locale}/help`}))} t={t}/></div>;
}

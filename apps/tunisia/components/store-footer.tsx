import {storefrontDepartments} from '../../../packages/storefront/departments';
import Link from 'next/link';
import {SharedFooter,footerColumns} from '../../../packages/storefront/footer';
import {storefrontTranslator} from '@/lib/storefront-locale';
import {messages} from '@/lib/messages';
import {socialLinks} from '@/lib/social';
import type {Locale} from '@/lib/catalogue';
export function StoreFooter({locale}:{locale:Locale}){
 const t=storefrontTranslator(locale),url=(s='')=>`/${locale}${s?'/'+s:''}`;
 const href=(path:string)=>{if(path==='/')return url();if(path.startsWith('/browse'))return url('shop')+(path.includes('maxPrice')?'?maxPrice=50':'');if(path.startsWith('/department/')){const keys:Record<string,string>={'kitchen-dining':'kitchen','home-living':'home','toys-kids-baby':'kids'};return url('shop?q='+(keys[path.split('/').pop()!]||path.split('/').pop()));}return url(({'/contact':'help#contact','/shipping-faq':'help#delivery','/returns':'help#returns','/about':'help#company','/partners':'help#contact','/sitemap-page':'collections'} as Record<string,string>)[path]||path.slice(1));};
 return <SharedFooter business={{legalName:'Masaphokati Global Shelf (Pty) Ltd',registrationNumber:'2026/850096/07',phoneHref:'+27740126873',phone:'+27 74 012 6873',email:'hello@plentovo.com'}} logo={<img src="/tunisia/brand/plentovo-light.svg" alt="Plentovo" className="h-auto w-44"/>} cookies={<Link href={url('cookies')}>{t('Cookie policy')}</Link>} socialLinks={socialLinks} departments={storefrontDepartments.map(d=>({slug:d.slug,name:t(d.name),href:href('/department/'+d.slug)}))} columns={footerColumns.map(c=>({title:t(c.title),links:c.links.map(l=>({name:l.name==='Finds under R300'?(locale==='fr'?'Trouvailles à moins de 50 DT':locale==='ar'?'اختيارات بأقل من 50 د.ت':'Finds under 50 DT'):t(l.name),href:href(l.href)}))}))} market={messages[locale].country} prices={`${messages[locale].country} · ${messages[locale].currency}`} href={href} t={t}/>;
}

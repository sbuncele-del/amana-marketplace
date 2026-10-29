'use client';
import {storefrontDepartments} from '../../../packages/storefront/departments';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {MapPin,UserRound} from 'lucide-react';
import {SharedHeader} from '../../../packages/storefront/header';
import {storefrontTranslator} from '@/lib/storefront-locale';
import {messages} from '@/lib/messages';
import type {Locale} from '@/lib/catalogue';
export function StoreHeader({locale,route,count}:{locale:Locale;route:string;query:string;count:number}){
 const params=useSearchParams();
 const t=storefrontTranslator(locale),url=(s='')=>`/${locale}${s?'/'+s:''}`;
 const quickLinks=[['All products',''],['Kitchen & Dining','kitchen'],['Electronics','electronics'],['Kids, Toys & Baby','kids'],['Health & Beauty','care'],[locale==='fr'?'Moins de 50 DT':locale==='ar'?'أقل من 50 د.ت':'Under 50 DT','budget'],['In stock','available']].map(([name,key])=>({name:t(name),href:url('shop')+(key==='budget'?'?maxPrice=50':key?'?q='+key:'')}));
 return <SharedHeader market={`🇹🇳 ${messages[locale].country} · TND`} homeHref={url()} logo={<img src="/tunisia/brand/plentovo.svg" alt="Plentovo" className="h-auto w-32 sm:w-44"/>} location={<Link href={url('help#delivery')} aria-label={t('Set your location')} className="flex items-center gap-2 text-xs"><MapPin size={21}/><span className="hidden xl:block">{t('Set your location')}</span></Link>} account={<a href="https://plentovo.com/account" aria-label={t('My account')} className="flex min-h-11 items-center gap-2 text-sm"><UserRound size={21}/><span className="hidden lg:block text-xs"><span className="block text-gray-500">{t('Hello, sign in')}</span><span className="font-semibold">{t('My account')}</span></span></a>} itemCount={count} cartHref={url('cart')} trackHref={url('track')} helpHref={url('help')} searchName="q" searchAction={`/tunisia/${locale}/shop`} quickLinks={quickLinks} departments={storefrontDepartments.map(d=>({slug:d.slug,name:t(d.name),href:url('shop?q='+d.slug)}))} t={t} topExtra={<div className="flex gap-2" aria-label={locale==='fr'?'Langue':locale==='ar'?'اللغة':'Language'}>{(['en','fr','ar'] as const).map(l=><Link key={l} href={`/${l}${route?'/'+route:''}${params.size?'?'+params.toString():''}`} hrefLang={l} aria-current={locale===l?'page':undefined} className={l===locale?'font-bold text-white':'hover:text-white'}>{l==='en'?'EN':l==='fr'?'FR':'العربية'}</Link>)}</div>} openHelp={()=>window.dispatchEvent(new Event('plentovo:open-help'))}/>;
}


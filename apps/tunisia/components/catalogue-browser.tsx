'use client';
import {Suspense,useMemo,useState} from 'react';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import {SharedCatalogueBrowser} from '../../../packages/storefront/catalogue-browser';
import {storefrontDepartments} from '../../../packages/storefront/departments';
import {storefrontTranslator} from '@/lib/storefront-locale';
import {departmentAliases,belongsToDepartment,browseGroups,parseShopParams} from '@/lib/catalogue-browse';
import type {ProductGroup} from '@/lib/product-groups';
import type {Locale} from '@/lib/catalogue';
import {ProductCard} from './product-cards';
export type ServerShop={total:number;totalPages:number;page:number;counts:Record<string,number>};
// With `server`, groups already is the requested page of filtered results and the counts are for the whole catalogue.
export function TunisiaCatalogueBrowser({groups,locale,server}:{groups:ProductGroup[];locale:Locale;server?:ServerShop}){return <Suspense><BrowserRoute groups={groups} locale={locale} server={server}/></Suspense>;}
function BrowserRoute({groups,locale,server}:{groups:ProductGroup[];locale:Locale;server?:ServerShop}){
 const params=useSearchParams();const [filters,setFilters]=useState(false);
 return <BrowserContent key={params.toString()} groups={groups} locale={locale} server={server} filters={filters} setFilters={setFilters}/>;
}
function BrowserContent({groups,locale,server,filters,setFilters}:{groups:ProductGroup[];locale:Locale;server?:ServerShop;filters:boolean;setFilters:(v:boolean)=>void}){
 const params=useSearchParams(),pathname=usePathname(),router=useRouter();
 const t=useMemo(()=>storefrontTranslator(locale),[locale]);
 const {legacy,legacyCategory,activeCategory,search,available,min,max,sort}=parseShopParams(k=>params.get(k));
 const [view,setView]=useState<'grid'|'list'>('grid'),[draftSearch,setDraftSearch]=useState(search),[draftMin,setDraftMin]=useState(min),[draftMax,setDraftMax]=useState(max);
 const browseHref=`/${locale}/shop`;
 const departments=useMemo(()=>storefrontDepartments.map(d=>({slug:d.slug,name:t(d.name),href:`${browseHref}?category=${encodeURIComponent(d.slug)}`,count:server?server.counts[d.slug]??0:groups.filter(g=>belongsToDepartment(g,d.slug)).length})),[groups,browseHref,t,server]);
 const current=departments.find(d=>d.slug===activeCategory),title=search?`${t('Results for')} “${search}”`:current?.name||t('All products');
 const filtered=server?groups:browseGroups(groups,{category:activeCategory,search,available,min,max,sort});
 const totalPages=server?server.totalPages:Math.max(1,Math.ceil(filtered.length/25)),requested=Number(params.get('page')),page=server?server.page:Math.min(totalPages,Number.isSafeInteger(requested)&&requested>0?requested:1);
 function update(values:Record<string,string>,reset=true){const next=new URLSearchParams(params.toString());if(reset)next.delete('page');if(legacyCategory)next.set('category',legacyCategory);if(legacy==='available')next.set('available','true');if(search)next.set('search',search);next.delete('q');for(const [key,value] of Object.entries(values)){if(value)next.set(key,value);else next.delete(key);}router.push(`${pathname}${next.size?'?'+next.toString():''}`,{scroll:false});}
 function pageHref(target:number){const next=new URLSearchParams(params.toString());if(target===1)next.delete('page');else next.set('page',String(target));return `${browseHref}${next.size?'?'+next.toString():''}`;}
 const description=locale==='fr'?'Découvrez des trouvailles pour les maisons, les familles et la vie quotidienne en Tunisie.':locale==='ar'?'اكتشف اختيارات يومية للمنازل والعائلات وأنماط الحياة في تونس.':'Explore everyday finds for Tunisian homes, families and lifestyles.';
 return <SharedCatalogueBrowser departments={departments} current={current} title={title} description={description} homeHref={`/${locale}`} browseHref={browseHref} currencySymbol={locale==='ar'?'د.ت':'DT'} t={t} formatCount={n=>n.toLocaleString(locale==='ar'?'ar-TN':locale==='fr'?'fr-TN':'en-ZA')} activeCategory={activeCategory} available={available} min={min} max={max} search={search} sort={sort} page={page} view={view} setView={setView} results={{products:server?groups:filtered.slice((page-1)*25,page*25),total:server?server.total:filtered.length,totalPages,page}} filters={filters} setFilters={setFilters} draftSearch={draftSearch} setDraftSearch={setDraftSearch} draftMin={draftMin} setDraftMin={setDraftMin} draftMax={draftMax} setDraftMax={setDraftMax} update={update} reset={()=>{router.push(browseHref);setFilters(false);}} pageHref={pageHref} renderProduct={(group,list)=><ProductCard group={group} locale={locale} list={list}/>}/>;
}

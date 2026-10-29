'use client';
import {Suspense,useMemo,useState} from 'react';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import {SharedCatalogueBrowser} from '../../../packages/storefront/catalogue-browser';
import {storefrontDepartments} from '../../../packages/storefront/departments';
import {storefrontTranslator} from '@/lib/storefront-locale';
import {departmentAliases,belongsToDepartment,browseGroups} from '@/lib/catalogue-browse';
import type {ProductGroup} from '@/lib/product-groups';
import type {Locale} from '@/lib/catalogue';
import {ProductCard} from './product-cards';
export function TunisiaCatalogueBrowser({groups,locale}:{groups:ProductGroup[];locale:Locale}){return <Suspense><BrowserRoute groups={groups} locale={locale}/></Suspense>;}
function BrowserRoute({groups,locale}:{groups:ProductGroup[];locale:Locale}){
 const params=useSearchParams();const [filters,setFilters]=useState(false);
 return <BrowserContent key={params.toString()} groups={groups} locale={locale} filters={filters} setFilters={setFilters}/>;
}
function BrowserContent({groups,locale,filters,setFilters}:{groups:ProductGroup[];locale:Locale;filters:boolean;setFilters:(v:boolean)=>void}){
 const params=useSearchParams(),pathname=usePathname(),router=useRouter();
 const t=useMemo(()=>storefrontTranslator(locale),[locale]);
 const legacy=params.get('q')||'',legacyCategory=departmentAliases[legacy]||(storefrontDepartments.some(d=>d.slug===legacy)?legacy:'');
 const activeCategory=params.get('category')||legacyCategory;
 const search=params.get('search')||(!legacyCategory&&legacy!=='available'?legacy:'');
 const available=params.get('available')==='true'||legacy==='available',min=params.get('minPrice')||'',max=params.get('maxPrice')||'',sort=params.get('sort')||'featured';
 const [view,setView]=useState<'grid'|'list'>('grid'),[draftSearch,setDraftSearch]=useState(search),[draftMin,setDraftMin]=useState(min),[draftMax,setDraftMax]=useState(max);
 const browseHref=`/${locale}/shop`;
 const departments=useMemo(()=>storefrontDepartments.map(d=>({slug:d.slug,name:t(d.name),href:`${browseHref}?category=${encodeURIComponent(d.slug)}`,count:groups.filter(g=>belongsToDepartment(g,d.slug)).length})),[groups,browseHref,t]);
 const current=departments.find(d=>d.slug===activeCategory),title=search?`${t('Results for')} “${search}”`:current?.name||t('All products');
 const filtered=browseGroups(groups,{category:activeCategory,search,available,min,max,sort});
 const totalPages=Math.max(1,Math.ceil(filtered.length/25)),requested=Number(params.get('page')),page=Math.min(totalPages,Number.isSafeInteger(requested)&&requested>0?requested:1);
 function update(values:Record<string,string>,reset=true){const next=new URLSearchParams(params.toString());if(reset)next.delete('page');if(legacyCategory)next.set('category',legacyCategory);if(legacy==='available')next.set('available','true');if(search)next.set('search',search);next.delete('q');for(const [key,value] of Object.entries(values)){if(value)next.set(key,value);else next.delete(key);}router.push(`${pathname}${next.size?'?'+next.toString():''}`,{scroll:false});}
 function pageHref(target:number){const next=new URLSearchParams(params.toString());if(target===1)next.delete('page');else next.set('page',String(target));return `${browseHref}${next.size?'?'+next.toString():''}`;}
 const description=locale==='fr'?'Découvrez des trouvailles pour les maisons, les familles et la vie quotidienne en Tunisie.':locale==='ar'?'اكتشف اختيارات يومية للمنازل والعائلات وأنماط الحياة في تونس.':'Explore everyday finds for Tunisian homes, families and lifestyles.';
 return <SharedCatalogueBrowser departments={departments} current={current} title={title} description={description} homeHref={`/${locale}`} browseHref={browseHref} currencySymbol={locale==='ar'?'د.ت':'DT'} t={t} formatCount={n=>n.toLocaleString(locale==='ar'?'ar-TN':locale==='fr'?'fr-TN':'en-ZA')} activeCategory={activeCategory} available={available} min={min} max={max} search={search} sort={sort} page={page} view={view} setView={setView} results={{products:filtered.slice((page-1)*25,page*25),total:filtered.length,totalPages,page}} filters={filters} setFilters={setFilters} draftSearch={draftSearch} setDraftSearch={setDraftSearch} draftMin={draftMin} setDraftMin={setDraftMin} draftMax={draftMax} setDraftMax={setDraftMax} update={update} reset={()=>{router.push(browseHref);setFilters(false);}} pageHref={pageHref} renderProduct={(group,list)=><ProductCard group={group} locale={locale} list={list}/>}/>;
}

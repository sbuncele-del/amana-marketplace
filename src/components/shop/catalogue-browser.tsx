'use client';
import {SharedCatalogueBrowser} from '../../../packages/storefront/catalogue-browser';
import {useEffect,useState,Suspense} from 'react';
import {useRouter,useSearchParams,usePathname} from 'next/navigation';
import departments from '@/data/departments.json';
import {cataloguePage} from '@/lib/catalogue-pagination';
import {CatalogueCard,type CatalogueCardData} from './catalogue-card';
type Results={products:CatalogueCardData[];total:number;totalPages:number;page:number};
export function CatalogueBrowser(props:{category?:string;initial?:Results}){return <Suspense fallback={<p className="p-8">Loading catalogue…</p>}><BrowserRoute {...props}/></Suspense>;}
function BrowserRoute(props:{category?:string;initial?:Results}){
 const params=useSearchParams();
 const page=cataloguePage({page:params.get('page')||undefined});
 const [filters,setFilters]=useState(false);
 const initial=props.initial?.page===page&&Array.from(params.keys()).every(key=>key==='page')?props.initial:undefined;
 return <BrowserContent key={`${props.category||''}:${params.toString()}`} {...props} initial={initial} filters={filters} setFilters={setFilters}/>;
}
function BrowserContent({category='',initial,filters,setFilters}:{category?:string;initial?:Results;filters:boolean;setFilters:(open:boolean)=>void}){
 const params=useSearchParams();const pathname=usePathname();const router=useRouter();const query=params.toString();
 const activeCategory=category||params.get('category')||params.get('collection')||'';const search=params.get('search')||'';
 const sort=params.get('sort')||'featured';const available=params.get('available')==='true';const min=params.get('minPrice')||'';const max=params.get('maxPrice')||'';const page=cataloguePage({page:params.get('page')||undefined});
 const [results,setResults]=useState<Results>(initial||{products:[],total:0,totalPages:0,page:1});const [loading,setLoading]=useState(!initial);const [error,setError]=useState('');const [view,setView]=useState<'grid'|'list'>('grid');
 const [draftSearch,setDraftSearch]=useState(search);const [draftMin,setDraftMin]=useState(min);const [draftMax,setDraftMax]=useState(max);const [retry,setRetry]=useState(0);
 function update(values:Record<string,string>,reset=true){const next=new URLSearchParams(query);if(reset)next.delete('page');for(const [key,value] of Object.entries(values)){if(value)next.set(key,value);else next.delete(key);}router.push(`${pathname}${next.size?'?'+next.toString():''}`,{scroll:false});}
 useEffect(()=>{
  if(initial&&!retry)return;
  const controller=new AbortController();const q=new URLSearchParams(query);if(activeCategory)q.set('collection',activeCategory);q.set('page',String(page));q.set('limit','25');
  void fetch(`/api/catalogue?${q}`,{signal:controller.signal}).then(async res=>{if(!res.ok)throw new Error();const data=await res.json();if(!controller.signal.aborted)setResults(data);}).catch(()=>{if(!controller.signal.aborted)setError('We could not load these products. Please try again.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();
 },[query,activeCategory,page,initial,retry]);
 function pageHref(target:number){const next=new URLSearchParams(query);if(target===1)next.delete('page');else next.set('page',String(target));return `${pathname}${next.size?'?'+next.toString():''}`;}
 const current=departments.find(d=>d.slug===activeCategory);const title=search?`Results for “${search}”`:current?.name||'All products';
 return <SharedCatalogueBrowser departments={departments.map(d=>({...d,href:'/department/'+d.slug}))} current={current} searchPlaceholder={current?`Search ${current.name.toLowerCase()}…`:'Search the store…'} title={title} description="Explore everyday finds for South African homes, families and lifestyles." activeCategory={activeCategory} available={available} min={min} max={max} search={search} sort={sort} page={page} view={view} setView={setView} results={results} loading={loading} error={error} filters={filters} setFilters={setFilters} draftSearch={draftSearch} setDraftSearch={setDraftSearch} draftMin={draftMin} setDraftMin={setDraftMin} draftMax={draftMax} setDraftMax={setDraftMax} update={update} reset={()=>router.push(pathname)} pageHref={pageHref} renderProduct={(p,list)=><CatalogueCard product={p} list={list}/>} onRetry={()=>{setLoading(true);setError('');setRetry(r=>r+1);}}/>;
}

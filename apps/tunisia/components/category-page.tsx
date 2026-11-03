import Link from 'next/link';
import {ProductCards} from './product-cards';
import {storefrontTranslator} from '@/lib/storefront-locale';
import type {ProductGroup} from '@/lib/product-groups';
import type {Locale} from '@/lib/catalogue';
import type {CategoryLink} from '@/lib/category-pages';
export type CategoryView={slug:string;page:number;pages:number;total:number;ids:string[];links:CategoryLink[]};
const words={
 en:{all:'All products',home:'Home',page:'Page',prev:'Previous',next:'Next',more:'More categories',count:(n:number)=>`${n} products`},
 fr:{all:'Tous les produits',home:'Accueil',page:'Page',prev:'Précédent',next:'Suivant',more:'Autres catégories',count:(n:number)=>`${n} produits`},
 ar:{all:'كل المنتجات',home:'الرئيسية',page:'الصفحة',prev:'السابق',next:'التالي',more:'فئات أخرى',count:(n:number)=>`${n} منتجًا`},
} as const;
export function CategoryPage({locale,view,groups}:{locale:Locale;view:CategoryView;groups:ProductGroup[]}){
 const t=storefrontTranslator(locale),w=words[locale];
 const me=view.links.find(l=>l.slug===view.slug),name=t(me?.name||view.slug);
 const ordered=view.ids.map(id=>groups.find(g=>g.id===id)).filter((g):g is ProductGroup=>!!g);
 const href=(page:number)=>`/${locale}/category/${view.slug}${page>1?'?page='+page:''}`;
 return <section className="mx-auto max-w-[1400px] px-4 py-6" aria-label={name}>
  <nav aria-label="Breadcrumb" className="mb-3 text-sm"><Link prefetch={false} href={`/${locale}`}>{w.home}</Link> / <Link prefetch={false} href={`/${locale}/shop`}>{w.all}</Link> / <span>{name}</span></nav>
  <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
  <p className="mb-5 mt-1 text-sm opacity-70">{w.count(view.total)}{view.pages>1?` · ${w.page} ${view.page}/${view.pages}`:''}</p>
  <ProductCards groups={ordered} locale={locale}/>
  {view.pages>1&&<nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-4 text-sm font-semibold">
   {view.page>1?<Link prefetch={false} rel="prev" href={href(view.page-1)}>← {w.prev}</Link>:<span/>}
   {view.page<view.pages?<Link prefetch={false} rel="next" href={href(view.page+1)}>{w.next} →</Link>:<span/>}
  </nav>}
  <h2 className="mb-3 mt-10 text-xl font-bold">{w.more}</h2>
  <ul className="flex flex-wrap gap-2">{view.links.filter(l=>l.slug!==view.slug).map(l=><li key={l.slug}><Link prefetch={false} className="rounded-full border px-3 py-1 text-sm" href={`/${locale}/category/${l.slug}`}>{t(l.name)}</Link></li>)}</ul>
 </section>;
}

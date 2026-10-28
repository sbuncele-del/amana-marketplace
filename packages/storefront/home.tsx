import {Fragment,type ReactNode,type CSSProperties} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {ArrowRight,PackageCheck,MapPin,HeartHandshake} from 'lucide-react';
import {discoveryGroups} from './discovery';
export type DisplayProduct = {id:string;slug:string};
export type DiscoveryGroup = Omit<(typeof discoveryGroups)[number], 'items'> & {items: {label:string;image:string;department?:string;href?:string}[]};
export const defaultBudgets = [150,300,500].map((amount,i)=>({amount,label:`R${amount}`,href:`/browse?maxPrice=${amount}`,text:['Little additions to your everyday.','Useful essentials. Fresh possibilities.','More room for something you love.'][i]}));
export const defaultHelp = [{title:'Delivery, clearly explained',text:'See delivery rates, timelines and collection details.',href:'/shipping-faq'},{title:'Your place, remembered',text:'Sign in to save and manage your delivery addresses.',href:'/account'},{title:'A little help, when you need it',text:'Talk to us about a product, delivery or return.',href:'/contact'}];
export const identity = (s:string)=>s;
export function StorefrontLayout<P extends DisplayProduct>({store,theme,slideshow,missions,more,discovery=discoveryGroups,activeMerchandising,demandProducts,valueProducts,featuredProducts,collections,renderProduct,t=identity,valueTitle='Good finds under R300',valueHref='/browse?maxPrice=300&available=true',budgets=defaultBudgets,help=defaultHelp,title='Plentovo — Good things. Plenty of choice.'}:{
store:{sectionOrder:string[];hiddenSections:string[];featuredTitle:string};theme:{background:string;accent:string};slideshow:ReactNode;missions:ReactNode;more:ReactNode;discovery?:DiscoveryGroup[];activeMerchandising?:{headline:string;description:string}|null;demandProducts:P[];valueProducts:P[];featuredProducts:P[];collections:{slug:string;title:string;text:string;href?:string;products:P[]}[];renderProduct:(product:P)=>ReactNode;t?:(s:string)=>string;valueTitle?:string;valueHref?:string;budgets?:typeof defaultBudgets;help?:typeof defaultHelp;title?:string;
}) {
  // If a department genuinely has fewer than six available items, fit the grid to the actual count.
  const rowColumns = (count: number) =>
    count >= 6
      ? "xl:grid-cols-6"
      : count === 5
        ? "xl:grid-cols-5"
        : count === 4
          ? "xl:grid-cols-4"
          : count === 3
            ? "xl:grid-cols-3"
            : count === 2
              ? "xl:grid-cols-2"
              : "xl:grid-cols-1";

  const sections: Record<string, ReactNode> = {
    demand: activeMerchandising && (
      <section
        aria-labelledby="demand-title"
        className="mx-auto max-w-[1800px] px-4 pt-7"
      >
        <h2 id="demand-title" className="text-2xl font-bold">
          {activeMerchandising.headline}
        </h2>
        <p className="mb-5 mt-2 text-sm text-gray-600">
          {activeMerchandising.description}
        </p>
        <div
          className={`grid grid-cols-2 gap-3 md:grid-cols-3 ${rowColumns(demandProducts.length)}`}
        >
          {demandProducts.map((product) => (
            <Fragment key={product.slug}>{renderProduct(product)}</Fragment>
          ))}
        </div>
      </section>
    ),
    discovery: (
      <section
        aria-label={t("Discover your everyday")}
        className="mx-auto grid max-w-[1800px] gap-4 px-4 pt-5 sm:grid-cols-2 xl:grid-cols-4"
      >
        {discovery.map((group) => (
          <article
            key={group.title}
            className="flex flex-col rounded-xl border border-[#ECEAE5] bg-white p-4 lg:p-5"
          >
            <h2 className="text-xl font-bold leading-tight tracking-tight">
              {group.title}
            </h2>
            <p className="mt-1.5 text-xs leading-5 text-gray-500">
              {group.subtitle}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4">
              {group.items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href || `/department/${item.department}`}
                  className="group min-w-0"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-[#F6F4F0]">
                    <Image
                      src={item.image}
                      alt=""
                      unoptimized
                      fill
                      sizes="(max-width:640px) 44vw,(max-width:1280px) 22vw,200px"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <span className="mt-2 block text-[11px] font-medium group-hover:text-red-700">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
            <Link
              href={group.href}
              className="mt-5 flex items-center justify-center gap-3 rounded-full bg-[#F4F4F4] px-3 py-3 text-xs font-semibold transition hover:bg-red-50 hover:text-red-700"
            >
              {group.action}
              <ArrowRight size={15} />
            </Link>
          </article>
        ))}
      </section>
    ),
    value: valueProducts.length > 0 && (
      <section className="mx-auto max-w-[1800px] px-4 pt-10">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {valueTitle}
          </h2>
          <Link
            href={valueHref}
            className="shrink-0 text-xs font-semibold text-red-700"
          >
            {t("View all")} →
          </Link>
        </div>
        <div
          className={`grid grid-cols-2 gap-3 md:grid-cols-3 ${rowColumns(valueProducts.length)}`}
        >
          {valueProducts.map((product) => (
            <Fragment key={product.id}>{renderProduct(product)}</Fragment>
          ))}
        </div>
      </section>
    ),
    departments: collections
      .filter((c) => c.products.length)
      .map((c) => (
        <section key={c.slug} className="mx-auto max-w-[1800px] px-4 pt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{c.title}</h2>
              <p className="mt-2 text-sm text-gray-500">{c.text}</p>
            </div>
            <Link
              href={c.href || `/department/${c.slug}`}
              className="shrink-0 text-xs font-semibold text-red-700"
            >
              {t("Explore more")} →
            </Link>
          </div>
          <div
            className={`grid grid-cols-2 gap-3 md:grid-cols-3 ${rowColumns(c.products.length)}`}
          >
            {c.products.map((product) => (
              <Fragment key={product.id}>{renderProduct(product)}</Fragment>
            ))}
          </div>
        </section>
      )),
    more: more,
    budgets: (
      <section className="mx-auto max-w-[1800px] px-4 pt-10">
        <h2 className="text-2xl font-bold tracking-tight">
          {t("Good finds. Your budget.")}
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {budgets.map((b) => (
            <Link
              key={b.amount}
              href={b.href}
              className="group rounded-xl border border-[#E9E4DD] bg-[#EFE9DF] p-6 transition hover:border-red-300"
            >
              <p className="text-xs font-semibold text-gray-600">
                {t("Shop finds under")}
              </p>
              <h3 className="mt-2 text-4xl font-extrabold tracking-tight">
                {b.label}
              </h3>
              <p className="mt-3 text-sm text-gray-600">{b.text}</p>
              <span className="mt-5 flex items-center justify-between text-xs font-bold">
                {t("Explore the collection")}
                <ArrowRight size={17} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    ),
    help: (
      <section
        aria-label={t("Help with your shopping")}
        className="mx-auto max-w-[1800px] px-4 pt-10"
      >
        <div className="grid gap-6 rounded-xl border border-gray-200 bg-white p-6 sm:grid-cols-3">
          {help.map((s, index) => {const Icon = [PackageCheck,MapPin,HeartHandshake][index]; return (
            <Link
              href={s.href}
              key={s.title}
              className="flex gap-3 hover:text-red-700"
            >
              <Icon className="mt-1 shrink-0 text-red-700" size={23} />
              <div>
                <h2 className="text-sm font-bold">{s.title}</h2>
                <p className="mt-1 text-xs leading-5 text-gray-500">{s.text}</p>
              </div>
            </Link>
          );})}
        </div>
      </section>
    ),
    missions: missions,
    featured: featuredProducts.length > 0 && (
      <section className="mx-auto max-w-[1800px] px-4 pt-7">
        <h2 className="mb-5 text-2xl font-bold">{store.featuredTitle}</h2>
        <div
          className={`grid grid-cols-2 gap-3 md:grid-cols-3 ${rowColumns(featuredProducts.length)}`}
        >
          {featuredProducts.map((product) => (
            <Fragment key={product.slug}>{renderProduct(product)}</Fragment>
          ))}
        </div>
      </section>
    ),
  };
  return <main id="main-content" className="store-theme pb-14" style={{background:theme.background,'--store-accent':theme.accent} as CSSProperties}>
<h1 className="sr-only">{title}</h1>{slideshow}{store.sectionOrder.filter(id=>!store.hiddenSections.includes(id)).map(id=><div data-storefront-section={id} key={id}>{sections[id]}</div>)}
</main>;
}

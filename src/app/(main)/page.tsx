import {MoreDepartments} from '@/components/shop/more-departments';
import {ShoppingSlideshow} from '@/components/shop/shopping-slideshow';
import {getHomepageMerchandising} from '@/lib/homepage-merchandising-store';
import {ShoppingMissions} from '@/components/shop/shopping-missions';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, PackageCheck, MapPin, HeartHandshake } from 'lucide-react';
import { getCatalogueSnapshot, getCatalogueProduct } from '@/lib/catalogue';
import { CatalogueCard } from '@/components/shop/catalogue-card';

export const metadata: Metadata = {
  title: 'Online Shopping South Africa',
  description: 'Good things. Plenty of choice. Shop home, kitchen, electronics, beauty, kids and more at Plentovo, with South African delivery.',
  alternates: { canonical: '/' },
};

const discoveryGroups = [
  { title: 'Make yourself at home', subtitle: 'Stylish living for everyday life.', href: '/department/home-living', action: 'Shop home & kitchen', items: [
    { label: 'Furniture', department: 'furniture', image: '/brand/categories/furniture-v1.webp' },
    { label: 'Cookware', department: 'kitchen-dining', image: '/brand/categories/cookware-v1.webp' },
    { label: 'Bedding', department: 'home-living', image: '/brand/categories/bedding-v1.webp' },
    { label: 'Home décor', department: 'home-decor-gifts', image: '/brand/categories/home-decor-v1.webp' },
  ]},
  { title: 'A little everyday care', subtitle: 'Feel good, every day.', href: '/department/health-beauty', action: 'Shop beauty', items: [
    { label: 'Skincare', department: 'health-beauty', image: '/brand/categories/skincare-v1.webp' },
    { label: 'Hair care', department: 'health-beauty', image: '/brand/categories/hair-care-v1.webp' },
    { label: 'Fragrances', department: 'health-beauty', image: '/brand/categories/fragrances-v1.webp' },
    { label: 'Personal care', department: 'health-beauty', image: '/brand/categories/personal-care-v1.webp' },
  ]},
  { title: 'Made for play', subtitle: 'Big adventures start at home.', href: '/department/toys-kids-baby', action: 'Shop kids & baby', items: [
    { label: 'Toys & games', department: 'toys-kids-baby', image: '/brand/categories/toys-games-v1.webp' },
    { label: 'Baby essentials', department: 'toys-kids-baby', image: '/brand/categories/baby-essentials-v1.webp' },
    { label: 'Kids’ school', department: 'toys-kids-baby', image: '/brand/categories/kids-school-v1.webp' },
    { label: 'Outdoor play', department: 'toys-kids-baby', image: '/brand/categories/outdoor-play-v1.webp' },
  ]},
  { title: 'Smart everyday upgrades', subtitle: 'Tech, tools and a little more ease.', href: '/department/electronics', action: 'Shop electronics', items: [
    { label: 'Audio', department: 'electronics', image: '/brand/categories/audio-v1.webp' },
    { label: 'Wearables', department: 'electronics', image: '/brand/categories/wearables-v1.webp' },
    { label: 'Lighting', department: 'home-living', image: '/brand/categories/lighting-v1.webp' },
    { label: 'Organisation', department: 'storage-organisation', image: '/brand/categories/organisation-v1.webp' },
  ]},
];
const collectionSpecs = [
  { slug: 'kitchen-dining', title: 'Make room for kitchen joy', match: /mug|utensil|pan|pot|knife|chopping|kitchen|oil.*bottle|cutlery/i, text: 'Useful finds for the meals and moments you make.' },
  { slug: 'electronics', title: 'Small tech. More possibilities.', match: /speaker|headphone|earbud|charger|bluetooth.speaker|computer.mouse|power.bank/i, text: 'Practical upgrades for home, work and downtime.' },
  { slug: 'toys-kids-baby', title: 'More joy for the little ones', match: /toy|teddy|doll|puzzle|building.block|baby|play.mat/i, text: 'Find something for their next adventure.' },
  { slug: 'health-beauty', title: 'A little care, every day', match: /hair|skin|brush|beauty|makeup|groom|manicure|mirror/i, text: 'Everyday essentials for feeling your best.' },
  { slug: 'storage-organisation', title: 'A place for everything', match: /storage|organis|rack|shelf|basket|drawer/i, text: 'Simple ways to make more room at home.' },
  { slug: 'garden-outdoor', title: 'Good days start outside', match: /garden|plant|outdoor|camp|braai|picnic|solar/i, text: 'Find your next reason to enjoy the outdoors.' },
];

export default async function HomePage() {
  const snapshot = getCatalogueSnapshot();
  const valuePool = snapshot.filter(p => p.price > 0 && p.price < 300 && p.images.length);
  const valueCategories = [/desktop.fan|mini.fan/i,/lunch.box/i,/earbud/i,/water.bottle/i,/storage.container|food.container/i].map(match => valuePool.filter(p => match.test(p.name)).slice(0, 3));
  const valueHandles = [...new Set([0,1,2].flatMap(index => valueCategories.flatMap(products => products[index] ? [products[index].slug] : [])))];
  const selected = new Set<string>();
  const checked = new Map<string, ReturnType<typeof getCatalogueProduct>>();
  async function selectAvailable(handles: string[], maxPrice = Infinity) {
    const products: NonNullable<Awaited<ReturnType<typeof getCatalogueProduct>>>[] = [];
    // Refill after live validation, rather than truncating candidates before checking stock.
    const candidates = [...new Set(handles)].filter(slug => !selected.has(slug)).slice(0, 60);
    for (let offset = 0; offset < candidates.length && products.length < 6; offset += 6) {
      const batch = await Promise.all(candidates.slice(offset, offset + 6).map(slug => {
        let result = checked.get(slug);
        if (!result) { result = getCatalogueProduct(slug,false,false,'ZA'); checked.set(slug, result); }
        return result;
      }));
      for (const product of batch) {
        if (product && product.supplierAvailable && product.price > 0 && product.price < maxPrice && !selected.has(product.slug)) {
          products.push(product);
          selected.add(product.slug);
          if (products.length === 6) break;
        }
      }
    }
    return products;
  }
  const merchandising=await getHomepageMerchandising();
  const demandProducts=merchandising?await selectAvailable(merchandising.products.map(p=>p.slug)):[];
  const activeMerchandising=demandProducts.length?merchandising:null;
  const valueProducts = await selectAvailable([...valueHandles, ...valuePool.map(p => p.slug)], 300);
  const collections = [];
  for (const collection of [...collectionSpecs].sort((a,b)=>{
    const order=activeMerchandising?.departmentOrder||[];
    const rank=(slug:string)=>{const i=order.indexOf(slug);return i<0?order.length:i;};
    return rank(a.slug)-rank(b.slug);
  })) {
    const pool = snapshot.filter(p => p.collections.includes(collection.slug) && p.images.length);
    const handles = [...pool.filter(p => collection.match.test(p.name)), ...pool.filter(p => !collection.match.test(p.name))].map(p => p.slug);
    collections.push({ ...collection, products: await selectAvailable(handles) });
  }
  // If a department genuinely has fewer than six available items, fit the grid to the actual count.
  const rowColumns = (count: number) => count >= 6 ? 'xl:grid-cols-6' : count === 5 ? 'xl:grid-cols-5' : count === 4 ? 'xl:grid-cols-4' : count === 3 ? 'xl:grid-cols-3' : count === 2 ? 'xl:grid-cols-2' : 'xl:grid-cols-1';

  return <main id="main-content" className="bg-[#F7F6F3] pb-14">
    <h1 className="sr-only">Plentovo — Good things. Plenty of choice.</h1>
    <ShoppingSlideshow/>
    <ShoppingMissions/>

    {activeMerchandising&&<section aria-labelledby="demand-title" className="mx-auto max-w-[1800px] px-4 pt-7"><h2 id="demand-title" className="text-2xl font-bold">{activeMerchandising.headline}</h2><p className="mb-5 mt-2 text-sm text-gray-600">{activeMerchandising.description}</p><div className={`grid grid-cols-2 gap-3 md:grid-cols-3 ${rowColumns(demandProducts.length)}`}>{demandProducts.map(product=><CatalogueCard key={product.slug} product={product}/>)}</div></section>}
    <section aria-label="Discover your everyday" className="mx-auto grid max-w-[1800px] gap-4 px-4 pt-5 sm:grid-cols-2 xl:grid-cols-4">
      {discoveryGroups.map(group => <article key={group.title} className="flex flex-col rounded-xl border border-[#ECEAE5] bg-white p-4 lg:p-5">
        <h2 className="text-xl font-bold leading-tight tracking-tight">{group.title}</h2>
        <p className="mt-1.5 text-xs leading-5 text-gray-500">{group.subtitle}</p>
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4">{group.items.map(item => <Link key={item.label} href={`/department/${item.department}`} className="group min-w-0">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-[#F6F4F0]"><Image src={item.image} alt="" unoptimized fill sizes="(max-width:640px) 44vw,(max-width:1280px) 22vw,200px" className="object-cover transition duration-300 group-hover:scale-105" /></div>
          <span className="mt-2 block text-[11px] font-medium group-hover:text-red-700">{item.label}</span>
        </Link>)}</div>
        <Link href={group.href} className="mt-5 flex items-center justify-center gap-3 rounded-full bg-[#F4F4F4] px-3 py-3 text-xs font-semibold transition hover:bg-red-50 hover:text-red-700">{group.action}<ArrowRight size={15} /></Link>
      </article>)}
    </section>

    {valueProducts.length > 0 && <section className="mx-auto max-w-[1800px] px-4 pt-10"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Good finds under R300</h2><Link href="/browse?maxPrice=300&available=true" className="shrink-0 text-xs font-semibold text-red-700">View all →</Link></div><div className={`grid grid-cols-2 gap-3 md:grid-cols-3 ${rowColumns(valueProducts.length)}`}>{valueProducts.map(product => <CatalogueCard key={product.id} product={product} />)}</div></section>}

    {collections.filter(c => c.products.length).map(c => <section key={c.slug} className="mx-auto max-w-[1800px] px-4 pt-10"><div className="mb-5 flex items-end justify-between gap-4"><div><h2 className="text-2xl font-bold tracking-tight">{c.title}</h2><p className="mt-2 text-sm text-gray-500">{c.text}</p></div><Link href={`/department/${c.slug}`} className="shrink-0 text-xs font-semibold text-red-700">Explore more →</Link></div><div className={`grid grid-cols-2 gap-3 md:grid-cols-3 ${rowColumns(c.products.length)}`}>{c.products.map(product => <CatalogueCard key={product.id} product={product} />)}</div></section>)}

    <MoreDepartments/>

    <section className="mx-auto max-w-[1800px] px-4 pt-10"><h2 className="text-2xl font-bold tracking-tight">Good finds. Your budget.</h2><div className="mt-5 grid gap-4 sm:grid-cols-3">{[{amount:150,text:'Little additions to your everyday.'},{amount:300,text:'Useful essentials. Fresh possibilities.'},{amount:500,text:'More room for something you love.'}].map(b => <Link key={b.amount} href={`/browse?maxPrice=${b.amount}`} className="group rounded-xl border border-[#E9E4DD] bg-[#EFE9DF] p-6 transition hover:border-red-300"><p className="text-xs font-semibold text-gray-600">Shop finds under</p><h3 className="mt-2 text-4xl font-extrabold tracking-tight">R{b.amount}</h3><p className="mt-3 text-sm text-gray-600">{b.text}</p><span className="mt-5 flex items-center justify-between text-xs font-bold">Explore the collection<ArrowRight size={17} /></span></Link>)}</div></section>
    <section aria-label="Help with your shopping" className="mx-auto max-w-[1800px] px-4 pt-10"><div className="grid gap-6 rounded-xl border border-gray-200 bg-white p-6 sm:grid-cols-3">{[{icon:PackageCheck,title:'Delivery, clearly explained',text:'See delivery rates, timelines and collection details.',href:'/shipping-faq'},{icon:MapPin,title:'Your place, remembered',text:'Sign in to save and manage your delivery addresses.',href:'/account'},{icon:HeartHandshake,title:'A little help, when you need it',text:'Talk to us about a product, delivery or return.',href:'/contact'}].map(s => <Link href={s.href} key={s.title} className="flex gap-3 hover:text-red-700"><s.icon className="mt-1 shrink-0 text-red-700" size={23} /><div><h2 className="text-sm font-bold">{s.title}</h2><p className="mt-1 text-xs leading-5 text-gray-500">{s.text}</p></div></Link>)}</div></section>
  </main>;
}

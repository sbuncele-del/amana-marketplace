import {Suspense} from 'react';
import {defaultStore} from '@/lib/cms/defaults';
import {StorefrontLayout} from "../../../packages/storefront/home";
import { MoreDepartments } from "@/components/shop/more-departments";
import { ShoppingSlideshow } from "@/components/shop/shopping-slideshow";
import { getHomepageMerchandising } from "@/lib/homepage-merchandising-store";
import { ShoppingMissions } from "@/components/shop/shopping-missions";
import { liveCms } from "@/lib/cms/store";
import { themes, type StoreConfig } from "@/lib/cms/domain";
import { getCatalogueSnapshot, getCatalogueProduct } from "@/lib/catalogue";
import { CatalogueCard } from "@/components/shop/catalogue-card";

const collectionSpecs = [
  {
    slug: "kitchen-dining",
    title: "Make room for kitchen joy",
    match: /mug|utensil|pan|pot|knife|chopping|kitchen|oil.*bottle|cutlery/i,
    text: "Useful finds for the meals and moments you make.",
  },
  {
    slug: "electronics",
    title: "Small tech. More possibilities.",
    match:
      /speaker|headphone|earbud|charger|bluetooth.speaker|computer.mouse|power.bank/i,
    text: "Practical upgrades for home, work and downtime.",
  },
  {
    slug: "toys-kids-baby",
    title: "More joy for the little ones",
    match: /toy|teddy|doll|puzzle|building.block|baby|play.mat/i,
    text: "Find something for their next adventure.",
  },
  {
    slug: "health-beauty",
    title: "A little care, every day",
    match: /hair|skin|brush|beauty|makeup|groom|manicure|mirror/i,
    text: "Everyday essentials for feeling your best.",
  },
  {
    slug: "storage-organisation",
    title: "A place for everything",
    match: /storage|organis|rack|shelf|basket|drawer/i,
    text: "Simple ways to make more room at home.",
  },
  {
    slug: "garden-outdoor",
    title: "Good days start outside",
    match: /garden|plant|outdoor|camp|braai|picnic|solar/i,
    text: "Find your next reason to enjoy the outdoors.",
  },
];

async function LoadedStorefront({ config }: { config?: StoreConfig }) {
  const store = config || (await liveCms()).store;
  const snapshot = await getCatalogueSnapshot();
  const valuePool = snapshot.filter(
    (p) => p.price > 0 && p.price < 300 && p.images.length,
  );
  const valueCategories = [
    /desktop.fan|mini.fan/i,
    /lunch.box/i,
    /earbud/i,
    /water.bottle/i,
    /storage.container|food.container/i,
  ].map((match) => valuePool.filter((p) => match.test(p.name)).slice(0, 3));
  const valueHandles = [
    ...new Set(
      [0, 1, 2].flatMap((index) =>
        valueCategories.flatMap((products) =>
          products[index] ? [products[index].slug] : [],
        ),
      ),
    ),
  ];
  const selected = new Set<string>();
  const checked = new Map<string, ReturnType<typeof getCatalogueProduct>>();
  const deadline=Date.now()+6500;
  async function selectAvailable(handles: string[], maxPrice = Infinity) {
    const products: NonNullable<
      Awaited<ReturnType<typeof getCatalogueProduct>>
    >[] = [];
    // Refill after live validation, rather than truncating candidates before checking stock.
    const candidates = [...new Set(handles)]
      .filter((slug) => !selected.has(slug))
      .slice(0, 60);
    for (
      let offset = 0;
      offset < candidates.length && products.length < 6 && Date.now()<deadline;
      offset += 6
    ) {
      const batch = await Promise.all(
        candidates.slice(offset, offset + 6).map((slug) => {
          let result = checked.get(slug);
          if (!result) {
            result = getCatalogueProduct(slug, false, false, "ZA", Math.max(1,Math.min(4500,deadline-Date.now())));
            checked.set(slug, result);
          }
          return result;
        }),
      );
      for (const product of batch) {
        if (
          product &&
          product.supplierAvailable &&
          product.price > 0 &&
          product.price < maxPrice &&
          !selected.has(product.slug)
        ) {
          products.push(product);
          selected.add(product.slug);
          if (products.length === 6) break;
        }
      }
    }
    return products;
  }
  const merchandising = await getHomepageMerchandising();
  // Independent rows validate concurrently; no supplier row holds all later rows hostage.
  // Shared promises prevent duplicate product reads, and the deadline bounds refill work.
  const orderedSpecs=[...collectionSpecs].sort((a,b)=>{
    const order=merchandising?.departmentOrder||[];
    const rank=(slug:string)=>{const i=order.indexOf(slug);return i<0?order.length:i;};
    return rank(a.slug)-rank(b.slug);
  });
  const collectionTasks=orderedSpecs.map(async collection=>{
    const pool=snapshot.filter(p=>p.collections.includes(collection.slug)&&p.images.length);
    const handles=[...pool.filter(p=>collection.match.test(p.name)),...pool.filter(p=>!collection.match.test(p.name))].map(p=>p.slug);
    return {...collection,products:await selectAvailable(handles)};
  });
  const [demandProducts,featuredProducts,valueProducts,collections]=await Promise.all([
    merchandising?selectAvailable(merchandising.products.map(p=>p.slug)):Promise.resolve([]),
    selectAvailable(store.featuredSlugs),
    selectAvailable([...valueHandles,...valuePool.map(p=>p.slug)],300),
    Promise.all(collectionTasks),
  ]);
  const activeMerchandising=demandProducts.length?merchandising:null;
  const theme = themes[store.theme];
  return <StorefrontLayout store={store} theme={theme} slideshow={<ShoppingSlideshow slides={store.slides}/>} missions={<ShoppingMissions slugs={store.missionSlugs}/>} more={<MoreDepartments/>} activeMerchandising={activeMerchandising} demandProducts={demandProducts} valueProducts={valueProducts} featuredProducts={featuredProducts} collections={collections} renderProduct={product=><CatalogueCard product={product}/>}/>;
}

// Send the approved shopping structure immediately, even on a cold supplier/database read.
// Product rows replace this shell only after actual price/stock validation; no fabricated stock.
export default function Storefront({config}:{config?:StoreConfig}){
 const store=config||defaultStore;
 const shell=<StorefrontLayout store={store} theme={themes[store.theme]} slideshow={<ShoppingSlideshow slides={store.slides}/>} missions={<ShoppingMissions slugs={store.missionSlugs}/>} more={<MoreDepartments/>} activeMerchandising={null} demandProducts={[]} valueProducts={[]} featuredProducts={[]} collections={[]} renderProduct={product=><CatalogueCard product={product}/>}/>;
 return <Suspense fallback={shell}><LoadedStorefront config={config}/></Suspense>;
}

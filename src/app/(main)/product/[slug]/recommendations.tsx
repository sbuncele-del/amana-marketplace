import {getCatalogueProduct,getCatalogueSnapshot,type CatalogueProduct} from '@/lib/catalogue';
import {rankRecommendations} from '@/lib/product-recommendations';
import {CatalogueCard,type CatalogueCardData} from '@/components/shop/catalogue-card';

async function availableCards(candidates:CatalogueProduct[],excluded:Set<string>){
 const cards:CatalogueCardData[]=[];
 // Bounded parallel checks; stale snapshot stock is never used to exclude candidates.
 for(let start=0;start<20&&start<candidates.length&&cards.length<5;start+=10){
  const current=await Promise.all(candidates.slice(start,start+10).map(p=>getCatalogueProduct(p.slug)));
  for(const p of current){
   if(!p||excluded.has(p.slug))continue;
   const variant=p.variants.filter(v=>v.supplierAvailable&&v.price>0).sort((a,b)=>a.price-b.price)[0];
   if(!variant||!(variant.image||p.images[0]))continue;
   cards.push({...p,price:variant.price,images:[variant.image||p.images[0]],supplierAvailable:true});
   excluded.add(p.slug);if(cards.length===5)break;
  }
 }
 return cards;
}
export default async function ProductRecommendations({product}:{product:CatalogueProduct}){
 const ranked=rankRecommendations(product,getCatalogueSnapshot());
 const excluded=new Set([product.slug]);
 const similar=await availableCards(ranked.similar,excluded);
 const complements=await availableCards(ranked.complements,excluded);
 const rows=[{title:'You may also like',products:similar},{title:'Explore complementary finds',products:complements}];
 return <div className="mx-auto max-w-[1400px] space-y-10 px-4 pb-12">{rows.filter(r=>r.products.length>0).map(row=><section key={row.title} aria-label={row.title}>
 <h2 className="mb-5 text-2xl font-bold tracking-tight">{row.title}</h2>
 <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{row.products.map(p=><CatalogueCard key={p.slug} product={p}/>)}</div>
 </section>)}</div>;
}

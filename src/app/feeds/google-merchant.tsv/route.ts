import {getCatalogueProducts,getCatalogueSnapshotCached} from '@/lib/catalogue';
import {buildMerchantFeed} from '@/lib/merchant-feed';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=300;

export async function GET() {
 try {
  // Live supplier prices first, as on the product pages; the cached snapshot only covers a supplier outage.
  let source='live';
  const products=await getCatalogueProducts('','','newest',false,true).catch(async()=>{source='cached';return getCatalogueSnapshotCached();});
  const {tsv,count}=buildMerchantFeed(products);
  if(!count)throw new Error('Empty catalogue');
  return new Response(tsv,{headers:{
   'Content-Type':'text/tab-separated-values; charset=utf-8',
   'Cache-Control':'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
   'X-Robots-Tag':'noindex',
   'X-Product-Count':String(count),
   'X-Feed-Source':source,
  }});
 }catch(error) {
  console.error('Merchant feed generation failed',error instanceof Error?error.message:'Unknown error');
  return new Response('Product feed temporarily unavailable. Please retry later.',{status:503,headers:{'Cache-Control':'no-store','Retry-After':'300'}});
 }
}

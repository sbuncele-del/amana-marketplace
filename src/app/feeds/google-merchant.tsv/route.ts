import {getVerifiedFeedProducts} from '@/lib/catalogue';
import {buildMerchantFeed} from '@/lib/merchant-feed';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=300;

export async function GET() {
 try {
  // Availability comes from a live supplier check only; a collection that cannot be checked is left out, never assumed in stock.
  const {products,skipped}=await getVerifiedFeedProducts();
  const {tsv,count}=buildMerchantFeed(products);
  if(!count)throw new Error('Empty catalogue');
  return new Response(tsv,{headers:{
   'Content-Type':'text/tab-separated-values; charset=utf-8',
   'Cache-Control':'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
   'X-Robots-Tag':'noindex',
   'X-Product-Count':String(count),
   'X-Products-Skipped-Unverified':String(skipped),
  }});
 }catch(error) {
  console.error('Merchant feed generation failed',error instanceof Error?error.message:'Unknown error');
  return new Response('Product feed temporarily unavailable. Please retry later.',{status:503,headers:{'Cache-Control':'no-store','Retry-After':'300'}});
 }
}

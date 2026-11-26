import {getVerifiedFeedProducts} from '@/lib/catalogue';
import {buildPinterestFeed} from '@/lib/pinterest-feed';

export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=300;

export async function GET() {
 try {
  const {products,skipped}=await getVerifiedFeedProducts();
  const {csv,count}=buildPinterestFeed(products);
  if(!count)throw new Error('Empty catalogue');
  return new Response(csv,{headers:{
   'Content-Type':'text/csv; charset=utf-8',
   'Content-Disposition':'inline; filename="plentovo-south-africa.csv"',
   'Cache-Control':'public, max-age=0, s-maxage=300',
   'X-Robots-Tag':'noindex',
   'X-Product-Count':String(count),
   'X-Products-Skipped-Unverified':String(skipped),
  }});
 }catch(error) {
  console.error("Pinterest feed generation failed",error instanceof Error?error.message:"Unknown error");
  return new Response('Product feed temporarily unavailable. Please retry later.',{status:503,headers:{'Cache-Control':'no-store','Retry-After':'300'}});
 }
}

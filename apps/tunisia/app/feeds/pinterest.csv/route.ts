import {readCareRetailIndex} from '@/lib/care-retail-index';
import {buildTunisiaPinterestFeed} from '@/lib/pinterest-feed';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
 try{
  const {csv,count}=buildTunisiaPinterestFeed(await readCareRetailIndex());
  if(!count)throw new Error('Published catalogue unavailable');
  return new Response(csv,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'inline; filename="plentovo-tunisia-fr.csv"','Cache-Control':'public, max-age=0, s-maxage=300','X-Robots-Tag':'noindex','X-Product-Count':String(count)}});
 }catch{
  return new Response('Product feed temporarily unavailable. Please retry later.',{status:503,headers:{'Cache-Control':'no-store','Retry-After':'300'}});
 }
}

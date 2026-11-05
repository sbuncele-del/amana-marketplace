import {timingSafeEqual} from 'node:crypto';
import {getLiveProducts} from '@/lib/shipper-catalogue';
export const maxDuration=300;
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET;
 const actual=Buffer.from(request.headers.get('authorization')||'');
 const expected=Buffer.from('Bearer '+(secret||''));
 const headers={'Cache-Control':'no-store'};
 if(!secret||actual.length!==expected.length||!timingSafeEqual(actual,expected))return Response.json({error:'Unauthorized'},{status:401,headers});
 // Warm the same cache used by all public readers. Revalidation retains the last successful snapshot.
 const products=await getLiveProducts();
 return Response.json({products:products.length},{status:products.length?200:503,headers});
}

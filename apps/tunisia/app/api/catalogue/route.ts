import {getLiveProducts} from '@/lib/shipper-catalogue';
import {getStorefrontPreviewProducts} from '@/lib/storefront-preview';
import {groupProducts} from '@/lib/product-groups';
import {primaryDepartment} from '@/lib/catalogue-browse';

const PAGE_SIZE=24;
export async function GET(request:Request){
 const query=new URL(request.url).searchParams;
 const requested=Number(query.get('page'));
 const page=Number.isSafeInteger(requested)&&requested>0?requested:1;
 const category=query.get('category')||'';
 const preview=process.env.VERCEL_ENV==='preview'&&!process.env.SHIPPER_NETWORK_API_KEY&&!process.env.TUNISIA_SHIPPER_API_KEY;
 const catalogue=await (preview?getStorefrontPreviewProducts():getLiveProducts());
 if(!catalogue.length)return Response.json({error:'Catalogue unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
 const groups=groupProducts(catalogue).filter(g=>g.image&&g.priceMillimes>0&&(!category||primaryDepartment(g)===category));
 // Home cards need no variant payload; options remain on the detail page.
 const products=groups.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE).map(g=>({...g,variants:[]}));
 return Response.json({products,hasNextPage:page*PAGE_SIZE<groups.length},{headers:{'Cache-Control':'public, max-age=0, s-maxage=60'}});
}

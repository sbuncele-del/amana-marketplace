import {getLiveProducts} from '@/lib/shipper-catalogue';
import {getStorefrontPreviewProducts} from '@/lib/storefront-preview';
import {mobileCataloguePage} from '@/lib/mobile-catalogue-page';
export async function GET(request:Request){
 const query=new URL(request.url).searchParams;
 const requested=Number(query.get('page'));
 const page=Number.isSafeInteger(requested)&&requested>0?requested:1;
 const category=query.get('category')||'';
 const preview=process.env.VERCEL_ENV==='preview'&&!process.env.SHIPPER_NETWORK_API_KEY&&!process.env.TUNISIA_SHIPPER_API_KEY;
 const catalogue=await (preview?getStorefrontPreviewProducts():getLiveProducts());
 if(!catalogue.length)return Response.json({error:'Catalogue unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});
 return Response.json(mobileCataloguePage(catalogue,category,page),{headers:{'Cache-Control':'public, max-age=0, s-maxage=60'}});
}

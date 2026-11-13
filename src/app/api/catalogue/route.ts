import {NextRequest,NextResponse} from 'next/server';
import {getCataloguePage,getCatalogueSnapshotCached} from '@/lib/catalogue';
import {catalogueMarket} from '@/lib/commerce/selection';
import {catalogueSearch} from '@/lib/catalogue-search';
export async function GET(request:NextRequest){
 const q=request.nextUrl.searchParams;
 const page=Math.max(1,Math.floor(Number(q.get('page')))||1);const limit=Math.max(1,Math.min(48,Math.floor(Number(q.get('limit')))||25));
 const search=q.get('search')||'';const category=q.get('collection')||q.get('category')||'';const sort=q.get('sort')||'featured';
 let result;
 if(!q.has('minPrice')&&!q.has('maxPrice')&&q.get('available')!=='true'&&!['price-low','price-high'].includes(sort)){
  result=await getCataloguePage(search,category,page,limit,undefined,sort);
 }else{
  // Filter and paginate the same catalogue snapshot. Checkout revalidates current supplier terms.
  const snapshot=await catalogueMarket()?await getCatalogueSnapshotCached():[];
  const min=Number(q.get('minPrice'));
  const max=q.has('maxPrice')?Number(q.get('maxPrice')):Infinity;
  const available=q.get('available')==='true';
  const all=catalogueSearch(snapshot.filter(p=>
   (!category||p.collections.includes(category))&&
   (!available||p.supplierAvailable)&&
   (!Number.isFinite(min)||p.price>=Math.max(0,min))&&
   (!Number.isFinite(max)||p.price<=Math.max(0,max))
  ),search.trim().toLowerCase());
  if(sort==='price-low')all.sort((a,b)=>a.price-b.price);
  if(sort==='price-high')all.sort((a,b)=>b.price-a.price);
  result={products:all.slice((page-1)*limit,page*limit),total:all.length,page,totalPages:Math.ceil(all.length/limit),hasNextPage:page*limit<all.length};
 }
 const products=result.products.map(({details,sourceUrl,sourceCheckedAt,variants,...card})=>card);
 return NextResponse.json({...result,products},{headers:{'Cache-Control':'private, no-store'}});
}

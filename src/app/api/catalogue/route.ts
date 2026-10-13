import {NextRequest,NextResponse} from 'next/server';
import {getCatalogueProducts,getCataloguePage,getCatalogueProduct} from '@/lib/catalogue';
export async function GET(request:NextRequest){
 const q=request.nextUrl.searchParams;
 const page=Math.max(1,Math.floor(Number(q.get('page')))||1);const limit=Math.max(1,Math.min(48,Math.floor(Number(q.get('limit')))||24));
 const search=q.get('search')||'';const category=q.get('collection')||q.get('category')||'';const sort=q.get('sort')||'featured';
 let result;
 if(!q.has('minPrice')&&!q.has('maxPrice')&&q.get('available')!=='true'&&!['price-low','price-high'].includes(sort)){
  result=await getCataloguePage(search,category,page,limit);
 }else{
  let all=await getCatalogueProducts(search,category,sort,q.get('available')==='true');
  const min=Number(q.get('minPrice'));const max=q.has('maxPrice')?Number(q.get('maxPrice')):Infinity;
  all=all.filter(p=>(!Number.isFinite(min)||p.price>=Math.max(0,min))&&(!Number.isFinite(max)||p.price<=Math.max(0,max)));
  const visible=await Promise.all(all.slice((page-1)*limit,page*limit).map(p=>getCatalogueProduct(p.slug).then(current=>current??p)));
  result={products:visible.filter(p=>(!Number.isFinite(min)||p.price>=Math.max(0,min))&&(!Number.isFinite(max)||p.price<=Math.max(0,max))&&(q.get('available')!=='true'||p.supplierAvailable)),total:all.length,page,totalPages:Math.ceil(all.length/limit),hasNextPage:page*limit<all.length};
 }
 const products=result.products.map(({details,sourceUrl,sourceCheckedAt,variants,...card})=>card);
 return NextResponse.json({...result,products});
}

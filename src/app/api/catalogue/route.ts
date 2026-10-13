import { NextRequest, NextResponse } from 'next/server';
import { getCatalogueProducts } from '@/lib/catalogue';
export function GET(request: NextRequest) {
 const q=request.nextUrl.searchParams;
 const all=getCatalogueProducts(q.get('search') || '',q.get('collection') || q.get('category') || '',q.get('sort') || 'newest',q.get('available')==='true');
 const page=Math.max(1,Number(q.get('page'))||1); const limit=Math.max(1,Math.min(48,Number(q.get('limit'))||24));
 const products=all.slice((page-1)*limit,page*limit).map(({details,sourceUrl,sourceCheckedAt,variants,...card})=>card);
 return NextResponse.json({products,total:all.length,page,totalPages:Math.ceil(all.length/limit),hasNextPage:page*limit<all.length});
}

import { NextRequest, NextResponse } from 'next/server';
import { getCatalogueProducts } from '@/lib/catalogue';
export function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const products = getCatalogueProducts(q.get('search') || '', q.get('collection') || q.get('category') || '', q.get('sort') || 'newest');
  return NextResponse.json({ products, total: products.length, hasNextPage: false });
}

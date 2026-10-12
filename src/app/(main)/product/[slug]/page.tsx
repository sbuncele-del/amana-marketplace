import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCatalogueProduct } from '@/lib/catalogue';
import ProductPageClient from './product-client';
export async function generateMetadata({ params }: { params: Promise<{slug:string}> }): Promise<Metadata> {
  const {slug} = await params; const product = getCatalogueProduct(slug);
  return {title: product ? `${product.name} | Amana Marketplace` : 'Product not found', description: product?.description};
}
export default async function ProductPage({params}: {params: Promise<{slug:string}>}) {
  const {slug} = await params; const product = getCatalogueProduct(slug);
  if (!product) notFound();
  return <ProductPageClient product={product} />;
}

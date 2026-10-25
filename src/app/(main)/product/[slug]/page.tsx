import {Suspense} from 'react';
import ProductRecommendations from './recommendations';
import {auth} from '@/lib/auth';
export const dynamic='force-dynamic';
import Reviews from './reviews';
import {getProductReviews} from '@/lib/product-reviews';
import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {getCatalogueProduct} from '@/lib/catalogue';
import ProductPageClient from './product-client';
import {siteUrl} from '@/lib/site';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const p=await getCatalogueProduct(slug);return {title:p?.name||'Product not found',description:p?.description,alternates:{canonical:`/product/${slug}`},openGraph:p?{title:p.name,description:p.description,url:`/product/${slug}`,images:p.images.map(url=>({url,alt:p.name}))}:undefined};}
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=await getCatalogueProduct(slug);if(!p)notFound();const [reviews,session]=await Promise.all([getProductReviews(p.slug),auth()]);const url=`${siteUrl}/product/${p.slug}`;const schema={'@context':'https://schema.org','@type':'Product',name:p.name,description:p.description,...(reviews.count>0?{aggregateRating:{'@type':'AggregateRating',ratingValue:reviews.average,ratingCount:reviews.count},review:reviews.reviews.map(r=>({'@type':'Review',author:{'@type':'Person',name:r.name},datePublished:r.createdAt,reviewBody:r.comment,reviewRating:{'@type':'Rating',ratingValue:r.rating,bestRating:5,worstRating:1}}))}:{}),image:p.images.map(image=>new URL(image,siteUrl).href),...(p.sku?{sku:p.sku}:{}),offers:p.variants.map(v=>({'@type':'Offer',url,price:v.price,priceCurrency:'ZAR',availability:v.supplierAvailable?'https://schema.org/InStock':'https://schema.org/OutOfStock',itemCondition:'https://schema.org/NewCondition',seller:{'@type':'Organization',name:'Plentovo'}}))};return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/><ProductPageClient product={p}/><Suspense fallback={null}><ProductRecommendations product={p}/></Suspense><div className="mx-auto max-w-[1400px] px-4 pb-14"><Reviews slug={p.slug} initial={reviews} canModerate={session?.user?.role==='ADMIN'}/></div></>;}

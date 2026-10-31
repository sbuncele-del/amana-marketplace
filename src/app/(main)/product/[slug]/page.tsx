import {Suspense,cache} from 'react';
import ProductRecommendations from './recommendations';
// Served from the edge cache and refreshed at most every 5 minutes (the supplier feed itself refreshes every 5 minutes).
// The page no longer reads the visitor's session, so one rendered copy serves everyone, including search engines.
export const revalidate=300;
import Reviews from './reviews';
import {getProductReviews} from '@/lib/product-reviews';
import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {getCatalogueProduct} from '@/lib/catalogue';
import ProductPageClient from './product-client';
import {siteUrl} from '@/lib/site';
// These canonical public URLs describe the ZA catalogue, independently of visitor location.
// Checkout and fulfilment keep their own market/authorization checks.
const publicProduct=cache((slug:string)=>getCatalogueProduct(slug,false,false,'ZA',undefined,true));
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const p=await publicProduct(slug);return {title:p?.name||'Product not found',description:p?.description,alternates:{canonical:`/product/${slug}`},openGraph:p?{title:p.name,description:p.description,url:`/product/${slug}`,images:p.images.map(url=>({url,alt:p.name}))}:undefined};}
export default async function ProductPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const p=await publicProduct(slug);if(!p)notFound();const reviews=await getProductReviews(p.slug);const url=`${siteUrl}/product/${p.slug}`;const schema={'@context':'https://schema.org','@type':'Product',name:p.name,description:p.description,...(reviews.count>0?{aggregateRating:{'@type':'AggregateRating',ratingValue:reviews.average,ratingCount:reviews.count},review:reviews.reviews.map(r=>({'@type':'Review',author:{'@type':'Person',name:r.name},datePublished:r.createdAt,reviewBody:r.comment,reviewRating:{'@type':'Rating',ratingValue:r.rating,bestRating:5,worstRating:1}}))}:{}),image:p.images.map(image=>new URL(image,siteUrl).href),...(p.sku?{sku:p.sku}:{}),offers:p.variants.map(v=>({'@type':'Offer',url,price:v.price,priceCurrency:'ZAR',availability:v.supplierAvailable?'https://schema.org/InStock':'https://schema.org/OutOfStock',itemCondition:'https://schema.org/NewCondition',seller:{'@type':'Organization',name:'Plentovo'}}))};return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/><ProductPageClient product={p}/><Suspense fallback={null}><ProductRecommendations product={p}/></Suspense><div className="mx-auto max-w-[1400px] px-4 pb-14"><Reviews slug={p.slug} initial={reviews}/></div></>;}

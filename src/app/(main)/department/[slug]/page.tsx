import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import departments from '@/data/departments.json';
import {getCataloguePage} from '@/lib/catalogue';
import {CatalogueBrowser} from '@/components/shop/catalogue-browser';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const d=departments.find(d=>d.slug===slug);return {title:d?`${d.name} Online in South Africa`:'Department not found',description:d?`Explore ${d.name.toLowerCase()} at Plentovo. Compare rand prices, browse product details and request South African delivery.`:undefined,alternates:{canonical:`/department/${slug}`}};}
export default async function DepartmentPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const d=departments.find(d=>d.slug===slug);if(!d)notFound();const result=await getCataloguePage('',slug);const products=result.products.map(p=>({id:p.id,name:p.name,slug:p.slug,images:p.images,price:p.price,currency:p.currency,supplierAvailable:p.supplierAvailable,category:p.category}));return <CatalogueBrowser category={slug} initial={{products,total:result.total,totalPages:result.totalPages,page:1}}/>;}

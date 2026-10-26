import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import departments from '@/data/departments.json';
import {CataloguePage} from '@/components/shop/catalogue-page';
import {catalogueCanonical, type CatalogueQuery} from '@/lib/catalogue-pagination';
type Props = {params:Promise<{slug:string}>; searchParams:Promise<CatalogueQuery>};
export async function generateMetadata({params, searchParams}:Props):Promise<Metadata> {
 const {slug}=await params;
 const d=departments.find(d=>d.slug===slug);
 return {title:d?`${d.name} Online in South Africa`:'Department not found', description:d?`Explore ${d.name.toLowerCase()} at Plentovo. Compare rand prices, browse product details with South African delivery.`:undefined, alternates:{canonical:catalogueCanonical(`/department/${slug}`, await searchParams)}};
}
export default async function DepartmentPage({params, searchParams}:Props) {
 const {slug}=await params;
 if(!departments.some(d=>d.slug===slug))notFound();
 return <CataloguePage category={slug} query={await searchParams}/>;
}

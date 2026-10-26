import type {Metadata} from 'next';
import {CataloguePage} from '@/components/shop/catalogue-page';
import {catalogueCanonical, type CatalogueQuery} from '@/lib/catalogue-pagination';
type Props = {searchParams: Promise<CatalogueQuery>};
export async function generateMetadata({searchParams}: Props): Promise<Metadata> {
 return {title:'Browse Products in South Africa', description:'Explore home, kitchen, electronics, beauty, kids and more. Filter by price and availability at Plentovo.', alternates:{canonical:catalogueCanonical('/browse', await searchParams)}};
}
export default async function BrowsePage({searchParams}: Props) {
 return <CataloguePage query={await searchParams}/>;
}

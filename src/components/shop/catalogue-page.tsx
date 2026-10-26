import {getCataloguePage} from '@/lib/catalogue';
import {cataloguePage, isCataloguePageQuery, type CatalogueQuery} from '@/lib/catalogue-pagination';
import {CatalogueBrowser} from './catalogue-browser';

// Public South African catalogue reads must not depend on a crawler's location.
export async function CataloguePage({category = '', query}: {category?: string; query: CatalogueQuery}) {
 if (!isCataloguePageQuery(query)) return <CatalogueBrowser category={category}/>;
 const page = cataloguePage(query);
 const result = await getCataloguePage('', category, page, 25, 'ZA');
 const products = result.products.map(p => ({id:p.id, name:p.name, slug:p.slug, images:p.images, price:p.price, currency:p.currency, supplierAvailable:p.supplierAvailable, category:p.category}));
 return <CatalogueBrowser category={category} initial={{products, total:result.total, totalPages:result.totalPages, page}}/>;
}

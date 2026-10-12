import catalogue from '@/data/catalogue.json';
export type CatalogueProduct = (typeof catalogue)[number];
export function getCatalogueProduct(slug: string) { return catalogue.find(p => p.slug === slug) ?? null; }
export function getCatalogueProducts(search = '', category = '', sort = 'newest', availableOnly = false) {
 const term=search.trim().toLowerCase();
 const products=catalogue.filter(p=>(!category || p.collections.includes(category)) && (!availableOnly || p.supplierAvailable) && (!term || `${p.name} ${p.description} ${p.category.name}`.toLowerCase().includes(term)));
 return [...products].sort((a,b)=>sort==='price-low' ? Number(a.priceOnRequest)-Number(b.priceOnRequest) || a.price-b.price : sort==='price-high' ? Number(a.priceOnRequest)-Number(b.priceOnRequest) || b.price-a.price : 0);
}

import catalogue from '@/data/catalogue.json';
export type CatalogueProduct = (typeof catalogue)[number];
export function getCatalogueProduct(slug: string) { return catalogue.find(p => p.slug === slug) ?? null; }
export function getCatalogueProducts(search = '', category = '', sort = 'newest') {
  const term = search.trim().toLowerCase();
  const matchesCategory = !category || ['air-fryers', 'home-living', 'kitchen-dining', 'appliances'].includes(category);
  const products = matchesCategory ? catalogue.filter(p => !term || `${p.name} ${p.description} ${p.category.name}`.toLowerCase().includes(term)) : [];
  return [...products].sort((a,b) => sort === 'price-low' ? a.price-b.price : sort === 'price-high' ? b.price-a.price : 0);
}

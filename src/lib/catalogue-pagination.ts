export type CatalogueQuery = Record<string, string | string[] | undefined>;
export function cataloguePage(query: CatalogueQuery) {
 const value = query.page;
 const number = typeof value === 'string' ? Number(value) : 1;
 return Number.isFinite(number) ? Math.max(1, Math.floor(number) || 1) : 1;
}
export function isCataloguePageQuery(query: CatalogueQuery) {
 return Object.keys(query).every(key => key === 'page');
}
export function catalogueCanonical(path: string, query: CatalogueQuery) {
 const page = cataloguePage(query);
 return isCataloguePageQuery(query) && page > 1 ? `${path}?page=${page}` : path;
}

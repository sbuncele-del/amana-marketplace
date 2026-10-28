// Storefront read helpers: pure mapping and pagination, shared by the database
// path and the legacy live-API path.
import {imageAllowed} from './content';
import {likeEscape, type CatalogueStore} from './store';
import type {Locale, Product, ProductCard} from '../catalogue';
export const PAGE_SIZE = 24, HOME_SIZE = 12;
type Idea = {key: string; title: Record<Locale, string>};
export function searchTerms(q: string, locale: Locale, ideas: Idea[]): string[] {
 const text = q.trim().slice(0, 100);
 if (!text) return [];
 const idea = ideas.find(i => i.key === text);
 return idea ? [idea.key, ...Object.values(idea.title)] : [text];
}
export const toPatterns = (terms: string[]) => terms.map(t => `%${likeEscape(t)}%`);
// Same matching rule the storefront always used: category plus the title in the current language.
export function filterProducts<T extends {category: string; title: Record<Locale, string>}>(products: T[], q: string, locale: Locale, ideas: Idea[]): T[] {
 const terms = searchTerms(q, locale, ideas).map(t => t.toLocaleLowerCase());
 if (!terms.length) return products;
 return products.filter(p => { const hay = (p.category + ' ' + p.title[locale]).toLocaleLowerCase(); return terms.some(t => hay.includes(t)); });
}
export function rowToProduct(row: any, hosts: string[]): Product | null {
 const images: string[] = (Array.isArray(row.images) ? row.images : []).filter((i: unknown) => imageAllowed(i, hosts));
 if (!images.length || !Number.isSafeInteger(row.price_millimes) || row.price_millimes <= 0) return null;
 const label: string = row.label || '';
 const withLabel = (t: Record<Locale, string>) => (label ? {en: `${t.en} — ${label}`, fr: `${t.fr} — ${label}`, ar: `${t.ar} — ${label}`} : t);
 return {id: row.id, supplierProductId: row.id, slug: row.slug, title: withLabel(row.title), description: row.description, category: row.category, image: images[0], images, priceMillimes: row.price_millimes, stock: Math.max(0, row.stock ?? 0), active: true};
}
export const toCard = ({id, slug, supplierProductId, title, category, image, priceMillimes, stock, active}: Product): ProductCard => ({id, slug, supplierProductId, title, category, image, priceMillimes, stock, active});
export type Page<T> = {items: T[]; total: number; page: number; pages: number};
export function paginate<T>(all: T[], page: number, size: number): Page<T> {
 const pages = Math.max(1, Math.ceil(all.length / size));
 const p = Math.min(Math.max(1, Math.floor(page) || 1), pages);
 return {items: all.slice((p - 1) * size, p * size), total: all.length, page: p, pages};
}
export async function searchStore(store: CatalogueStore, o: {q: string; locale: Locale; page: number; size: number; ideas: Idea[]; hosts: string[]}): Promise<Page<ProductCard>> {
 const patterns = toPatterns(searchTerms(o.q, o.locale, o.ideas));
 const wanted = Math.max(1, Math.floor(o.page) || 1);
 let res = await store.search({patterns, locale: o.locale, limit: o.size, offset: (wanted - 1) * o.size});
 const pages = Math.max(1, Math.ceil(res.total / o.size));
 let page = wanted;
 if (wanted > pages) { page = pages; res = await store.search({patterns, locale: o.locale, limit: o.size, offset: (pages - 1) * o.size}); }
 const items = res.rows.map(r => rowToProduct(r, o.hosts)).filter((p): p is Product => !!p).map(toCard);
 return {items, total: res.total, page, pages};
}

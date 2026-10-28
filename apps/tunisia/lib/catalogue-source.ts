import 'server-only';
import {ideas} from './merchandising';
import {createPgDb} from './import/db';
import {createStore, type CatalogueStore} from './import/store';
import {createShipperClient} from './import/client';
import {loadConfig} from './import/config';
import {runImport} from './import/runner';
import {filterProducts, paginate, rowToProduct, searchStore, toCard, type Page} from './import/read';
import {getLiveProducts} from './shipper-catalogue';
import type {Locale, Product, ProductCard} from './catalogue';
const token = () => process.env.SHIPPER_NETWORK_API_KEY || process.env.TUNISIA_SHIPPER_API_KEY;
let storePromise: Promise<CatalogueStore | null> | undefined;
export function getCatalogueStore(): Promise<CatalogueStore | null> {
 const url = process.env.TUNISIA_DATABASE_URL;
 if (!url) return Promise.resolve(null);
 return (storePromise ??= createPgDb(url).then(createStore).catch(e => { storePromise = undefined; throw e; }));
}
// The database is used only once it holds a completed sync; until then the
// storefront keeps serving the live account catalogue exactly as before.
async function activeStore(): Promise<CatalogueStore | null> {
 try {
  const store = await getCatalogueStore();
  return store && (await store.lastSync()) ? store : null;
 } catch { console.warn('[Tunisia] catalogue database unavailable; using live catalogue.'); return null; }
}
export async function listProducts(o: {q: string; locale: Locale; page: number; size: number}): Promise<Page<ProductCard>> {
 const store = await activeStore();
 if (store) {
  try { return await searchStore(store, {...o, ideas, hosts: loadConfig().imageHosts}); }
  catch { console.warn('[Tunisia] catalogue query failed; using live catalogue.'); }
 }
 const page = paginate(filterProducts(await getLiveProducts(), o.q, o.locale, ideas), o.page, o.size);
 return {...page, items: page.items.map(toCard)};
}
export async function getProduct(slug: string): Promise<Product | null> {
 const store = await activeStore();
 if (store) {
  try { const row = await store.bySlug(slug); return row ? rowToProduct(row, loadConfig().imageHosts) : null; }
  catch { console.warn('[Tunisia] catalogue query failed; using live catalogue.'); }
 }
 return (await getLiveProducts()).find(p => p.slug === slug) ?? null;
}
// `authoritative` tells the browser whether an absent item is really gone. It is false when the answer came
// from a degraded source (an empty live list), so a temporary outage can never empty someone's cart.
export async function getCards(ids: string[]): Promise<{items: ProductCard[]; authoritative: boolean}> {
 if (!ids.length) return {items: [], authoritative: true};
 const store = await activeStore();
 if (store) {
  try { return {items: (await store.byIds(ids)).map(r => rowToProduct(r, loadConfig().imageHosts)).filter((p): p is Product => !!p).map(toCard), authoritative: true}; }
  catch { console.warn('[Tunisia] catalogue query failed; using live catalogue.'); }
 }
 const live = await getLiveProducts();
 return {items: live.filter(p => ids.includes(p.id)).map(toCard), authoritative: live.length > 0};
}
// Stale-while-revalidate: called after the response is sent, so shoppers never wait on a sync.
let lastChecked = 0;
export async function syncIfStale(): Promise<void> {
 if (Date.now() - lastChecked < 60000) return;
 lastChecked = Date.now();
 try {
  const key = token(), store = await getCatalogueStore();
  if (!key || !store) return;
  const config = loadConfig();
  await store.ensureSchema();
  const last = await store.lastSync();
  if (last && Date.now() - last.getTime() < config.freshnessMs) return;
  await runImport({client: createShipperClient({token: key}), store, config, trigger: 'stale-read'});
 } catch (e) { console.warn('[Tunisia] background catalogue sync did not complete:', e instanceof Error ? e.message : 'error'); }
}

import {getCatalogueSnapshot} from '@/lib/catalogue';
import {shoppingMissions} from '@/lib/shopping-missions';
import departments from '@/data/departments.json';
import {siteUrl, publicPages} from '@/lib/site';
import type {MetadataRoute} from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 const products = (await getCatalogueSnapshot());
 const directoryPages = Array.from({length: Math.ceil(products.length / 100)}, (_, i) => ({
  url: siteUrl + '/sitemap-page/products' + (i ? '?page=' + (i + 1) : ''),
 }));
 return [
  ...publicPages.map(path => ({url:siteUrl + path})),
  ...shoppingMissions.map(m => ({url:siteUrl + '/collections/' + m.slug})),
  ...departments.map(d => ({url:siteUrl + '/department/' + d.slug})),
  ...directoryPages,
  ...products.map(p => ({url:siteUrl + '/product/' + p.slug, images:p.images.map(image => new URL(image,siteUrl).href)})),
 ];
}

import {getCatalogueSnapshotCached} from '@/lib/catalogue';
import {pagesXml, parseFile, productsXml} from '@/lib/sitemaps';
import {shoppingMissions} from '@/lib/shopping-missions';
import departments from '@/data/departments.json';
import {siteUrl, publicPages} from '@/lib/site';

export const revalidate = 3600;
const headers = {'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'};

export async function GET(_request: Request, {params}: {params: Promise<{file: string}>}) {
  const file = parseFile((await params).file);
  if (!file) return new Response('Not found', {status: 404});
  const products = await getCatalogueSnapshotCached();
  if (!products.length) return new Response('Catalogue temporarily unavailable', {status: 503, headers: {'Retry-After': '300', 'Cache-Control': 'no-store'}});
  if (file.kind === 'pages') {
    const directory = Array.from({length: Math.ceil(products.length / 100)}, (_, i) => `${siteUrl}/sitemap-page/products${i ? `?page=${i + 1}` : ''}`);
    return new Response(pagesXml([...publicPages.map(p => siteUrl + p), ...shoppingMissions.map(m => `${siteUrl}/collections/${m.slug}`), ...departments.map(d => `${siteUrl}/department/${d.slug}`), ...directory]), {headers});
  }
  const xml = productsXml(siteUrl, products, file.n);
  return xml ? new Response(xml, {headers}) : new Response('Not found', {status: 404});
}

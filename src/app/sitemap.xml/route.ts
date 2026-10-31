import {getCatalogueSnapshotCached} from '@/lib/catalogue';
import {indexXml} from '@/lib/sitemaps';
import {siteUrl} from '@/lib/site';

export const revalidate = 3600;

// The sitemap index. Individual files live under /sitemaps/ (see src/lib/sitemaps.ts).
export async function GET() {
  const products = await getCatalogueSnapshotCached();
  // Never publish an empty catalogue sitemap during an outage; Google would read it as "no products".
  if (!products.length) return new Response('Catalogue temporarily unavailable', {status: 503, headers: {'Retry-After': '300', 'Cache-Control': 'no-store'}});
  return new Response(indexXml(siteUrl, products.length), {headers: {'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400'}});
}

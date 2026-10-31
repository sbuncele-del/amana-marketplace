// Sitemap index plus smaller files: one for site pages, the rest for products. Smaller files let Search Console report
// indexing per file. No <lastmod> is written because the catalogue has no trustworthy modification date, and a made-up
// date teaches Google to ignore the field.
export const PRODUCTS_PER_FILE = 2000;
export type SitemapProduct = {slug: string; images: string[]};

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]!));
const head = '<?xml version="1.0" encoding="UTF-8"?>\n';

export const productFileCount = (total: number) => Math.ceil(total / PRODUCTS_PER_FILE);

export function indexXml(siteUrl: string, totalProducts: number) {
  const files = ['pages.xml', ...Array.from({length: productFileCount(totalProducts)}, (_, i) => `products-${i + 1}.xml`)];
  return `${head}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${files.map(f => `<sitemap><loc>${esc(`${siteUrl}/sitemaps/${f}`)}</loc></sitemap>`).join('\n')}\n</sitemapindex>\n`;
}

export function pagesXml(urls: string[]) {
  return `${head}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(urls)].map(u => `<url><loc>${esc(u)}</loc></url>`).join('\n')}\n</urlset>\n`;
}

/** File `n` (1-based) of the product sitemap, or null if there is no such file. */
export function productsXml(siteUrl: string, products: readonly SitemapProduct[], n: number) {
  if (!Number.isInteger(n) || n < 1 || n > productFileCount(products.length)) return null;
  const rows = products.slice((n - 1) * PRODUCTS_PER_FILE, n * PRODUCTS_PER_FILE).map(p => {
    const images = p.images.map(i => { try { return `<image:image><image:loc>${esc(new URL(i, siteUrl).href)}</image:loc></image:image>`; } catch { return ''; } }).join('');
    return `<url><loc>${esc(`${siteUrl}/product/${p.slug}`)}</loc>${images}</url>`;
  });
  return `${head}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${rows.join('\n')}\n</urlset>\n`;
}

/** Maps a requested file name to its type; anything else is not a sitemap file. */
export function parseFile(name: string): {kind: 'pages'} | {kind: 'products'; n: number} | null {
  if (name === 'pages.xml') return {kind: 'pages'};
  const m = /^products-([1-9]\d{0,2})\.xml$/.exec(name);
  return m ? {kind: 'products', n: Number(m[1])} : null;
}

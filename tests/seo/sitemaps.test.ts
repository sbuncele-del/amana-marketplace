import assert from 'node:assert/strict';
import {test} from 'node:test';
import {PRODUCTS_PER_FILE, indexXml, pagesXml, parseFile, productFileCount, productsXml, type SitemapProduct} from '../../src/lib/sitemaps';

const site = 'https://plentovo.com';
const make = (n: number): SitemapProduct[] => Array.from({length: n}, (_, i) => ({slug: `item-${i}`, images: [`https://img.example/${i}.jpg`]}));
const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map(m => m[1]);

test('products are split into files that together list every product exactly once', () => {
  const products = make(PRODUCTS_PER_FILE * 2 + 57);
  assert.equal(productFileCount(products.length), 3);
  const all = [1, 2, 3].flatMap(n => locs(productsXml(site, products, n)!).filter(l => l.includes('/product/')));
  assert.equal(all.length, products.length);
  assert.equal(new Set(all).size, products.length);
  assert.equal(locs(productsXml(site, products, 3)!).filter(l => l.includes('/product/')).length, 57);
});
test('the index lists the pages file and every product file; no fake dates', () => {
  const xml = indexXml(site, 4500);
  assert.deepEqual(locs(xml), [`${site}/sitemaps/pages.xml`, `${site}/sitemaps/products-1.xml`, `${site}/sitemaps/products-2.xml`, `${site}/sitemaps/products-3.xml`]);
  assert.ok(!xml.includes('lastmod') && !productsXml(site, make(3), 1)!.includes('lastmod'));
});
test('out-of-range files are refused and file names are strictly parsed', () => {
  assert.equal(productsXml(site, make(10), 2), null);
  assert.equal(productsXml(site, make(10), 0), null);
  assert.equal(productsXml(site, make(10), 1.5), null);
  assert.deepEqual(parseFile('pages.xml'), {kind: 'pages'});
  assert.deepEqual(parseFile('products-12.xml'), {kind: 'products', n: 12});
  for (const bad of ['products-0.xml', 'products-.xml', 'products-1.xml.bak', '../products-1.xml', 'products-1', 'other.xml', 'products-1000.xml']) assert.equal(parseFile(bad), null, bad);
});
test('XML is escaped, images are absolute, duplicates in the pages list collapse', () => {
  const xml = productsXml(site, [{slug: 'a&b', images: ['/img/x.jpg?a=1&b=2', 'http://']}], 1)!;
  assert.ok(xml.includes('/product/a&amp;b') && xml.includes('https://plentovo.com/img/x.jpg?a=1&amp;b=2'));
  assert.equal((xml.match(/<image:image>/g) ?? []).length, 1);
  assert.equal(locs(pagesXml([`${site}`, `${site}/about`, `${site}`])).length, 2);
});

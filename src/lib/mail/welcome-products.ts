import 'server-only';
import {getCatalogueSnapshot, getCatalogueProduct} from '@/lib/catalogue';
import {ensureCommerce} from '@/lib/commerce/store';
import {experiencePool} from '@/lib/experience/store';
import type {WelcomeProduct} from './templates';

export async function welcomeRecommendations(market: string | null): Promise<WelcomeProduct[]> {
  if (market !== 'ZA') return [];
  await ensureCommerce();
  const active = await experiencePool().query("SELECT 1 FROM commerce_markets WHERE code=$1 AND status='ACTIVE' AND currency='ZAR'", [market]);
  if (!active.rowCount) return [];
  // Curated recommendations, not claimed bestsellers. Bound supplier work to twelve products.
  const candidates = getCatalogueSnapshot().filter(p => p.images.length).slice(0, 12);
  const found: WelcomeProduct[] = [];
  for (let i = 0; i < candidates.length && found.length < 4; i += 4) {
    const batch = await Promise.all(candidates.slice(i, i + 4).map(p => getCatalogueProduct(p.slug, true, true, market).catch(() => null)));
    for (const p of batch) {
      if (!p) continue;
      const variants = p.variants.filter(v => v.supplierAvailable && Number.isFinite(v.price) && v.price > 0);
      if (!variants.length) continue;
      found.push({name: p.name, slug: p.slug, image: p.images[0], price: Math.min(...variants.map(v => v.price)), currency: 'ZAR'});
    }
  }
  return found.slice(0, 4);
}

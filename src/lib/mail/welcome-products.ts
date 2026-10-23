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
  // Two available products per department; never label unproven items bestsellers.
  // Cap supplier checks at six candidates per department, in batches of six.
  const departments = ['home-living', 'kitchen-dining', 'electronics', 'health-beauty', 'toys-kids-baby', 'garden-outdoor'];
  const snapshot = getCatalogueSnapshot().filter(p => p.images.length);
  const used = new Set<string>();
  const groups = departments.map(department => ({department, found: [] as WelcomeProduct[], candidates: snapshot.filter(p => p.category.slug === department || p.collections.includes(department)).slice(0, 6)}));
  for (let round = 0; round < 6; round++) {
    const pending = groups.filter(g => g.found.length < 2 && g.candidates[round] && !used.has(g.candidates[round].slug));
    const checked = await Promise.all(pending.map(async g => ({g, product: await getCatalogueProduct(g.candidates[round].slug, true, true, market).catch(() => null)})));
    for (const {g, product: p} of checked) {
      if (!p || used.has(p.slug) || !p.images[0]) continue;
      const variants = p.variants.filter(v => v.supplierAvailable && Number.isFinite(v.price) && v.price > 0);
      if (!variants.length) continue;
      used.add(p.slug);
      const names: Record<string, string> = {'home-living':'Home & Living', 'kitchen-dining':'Kitchen & Dining', electronics:'Electronics', 'health-beauty':'Health & Beauty', 'toys-kids-baby':'Kids, Toys & Baby', 'garden-outdoor':'Garden & Outdoor'};
      g.found.push({name:p.name, slug:p.slug, image:p.images[0], price:Math.min(...variants.map(v => v.price)), currency:'ZAR', department:names[g.department]});
    }
  }
  return groups.flatMap(g => g.found).slice(0, 12);
}

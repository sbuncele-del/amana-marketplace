// "You may also like" for the Tunisia product page. Content-based only (same department, similar name, similar price),
// matching the South Africa store: it never claims what other customers bought, because we have no purchase data.
import {primaryDepartment} from './catalogue-browse';
import type {ProductGroup} from './product-groups';

const stop = new Set('with for and the your from piece set pack mini portable new pour avec les des une dans'.split(' '));
const terms = (g: ProductGroup) => new Set(Object.values(g.title).join(' ').toLowerCase().split(/[^a-zÀ-ÿ]+/).filter(w => w.length > 2 && !stop.has(w)));

export function recommend(viewed: ProductGroup, groups: ProductGroup[], limit = 6): ProductGroup[] {
  const department = primaryDepartment(viewed), source = terms(viewed);
  return groups
    .filter(g => g.id !== viewed.id && g.stock > 0 && g.image)
    .map(g => {
      const shared = [...terms(g)].filter(w => source.has(w)).length;
      const same = primaryDepartment(g) === department;
      const proximity = 1 / (1 + Math.abs(Math.log(Math.max(g.priceMillimes, 1) / Math.max(viewed.priceMillimes, 1))));
      return {g, score: shared * 10 + (same ? 5 : 0) + proximity};
    })
    .sort((a, b) => b.score - a.score || a.g.slug.localeCompare(b.g.slug))
    .slice(0, limit)
    .map(x => x.g);
}

export const recommendationTitle = {en: 'You may also like', fr: 'Vous aimerez aussi', ar: 'قد يعجبك أيضًا'} as const;

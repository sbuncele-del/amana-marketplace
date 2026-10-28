import type {ImportConfig} from './config';
import {imageAllowed, type ContentRecord, type Match} from './content';
import {choosePrice, type PriceBasis} from './pricing';
import {locales} from '../catalogue';
export type ItemState = 'published' | 'pending' | 'failed';
export type Reason =
 | 'inactive' | 'missing_from_account' | 'no_content' | 'ambiguous_content' | 'no_image'
 | 'incomplete_title_en' | 'incomplete_title_fr' | 'incomplete_title_ar'
 | 'incomplete_description_en' | 'incomplete_description_fr' | 'incomplete_description_ar'
 | 'translation_needs_review' | 'no_price' | 'price_below_cost'
 | 'invalid_price' | 'invalid_cost' | 'invalid_stock' | 'provisional_price';
export type DecisionInput = {
 status: string; missing: boolean; match: Match;
 accountPrice: number | null; recommendedPrice: number | null; cost: number | null; stock: number | null;
 dataErrors: Reason[];
};
export type Decision = {state: ItemState; reasons: Reason[]; price: number | null; basis: PriceBasis | null};
export function contentReasons(content: ContentRecord, config: ImportConfig): Reason[] {
 const out: Reason[] = [];
 for (const l of locales) {
  if (!content.title[l]) out.push(`incomplete_title_${l}` as Reason);
  if (!content.description[l]) out.push(`incomplete_description_${l}` as Reason);
 }
 if (!content.images.some(i => imageAllowed(i, config.imageHosts))) out.push('no_image');
 const machine = locales.some(l => content.provenance[l] === 'machine');
 // Anything awaiting review is held back, except machine translations when the
 // operator has explicitly allowed publishing them.
 if (content.reviewState === 'needs_review' && !(machine && config.publishMachineTranslations)) out.push('translation_needs_review');
 return out;
}
// Pure publish rule. "failed" is reserved for unparseable supplier data; anything
// we can fix by adding content or a price is "pending" with explicit reasons.
export function decide(input: DecisionInput, config: ImportConfig): Decision {
 if (input.dataErrors.length) return {state: 'failed', reasons: input.dataErrors, price: null, basis: null};
 const reasons: Reason[] = [];
 if (input.missing) reasons.push('missing_from_account');
 if (String(input.status).toLowerCase() !== 'active') reasons.push('inactive');
 if (input.match.method === 'ambiguous') reasons.push('ambiguous_content');
 else if (!input.match.record) reasons.push('no_content');
 else reasons.push(...contentReasons(input.match.record, config));
 const price = choosePrice({accountPrice: input.accountPrice, recommendedPrice: input.recommendedPrice, cost: input.cost}, config);
 if (price.price === null) reasons.push('no_price');
 else if (price.belowCost && config.blockBelowCost) reasons.push('price_below_cost');
 if (reasons.length) return {state: 'pending', reasons, price: price.price, basis: price.basis};
 return {state: 'published', reasons: price.basis === 'provisional' ? ['provisional_price'] : [], price: price.price, basis: price.basis};
}

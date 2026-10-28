import {units} from '../shipper-normalise';
import type {ImportConfig} from './config';
export type PriceBasis = 'account' | 'supplier_recommended' | 'provisional';
export type Money = {kind: 'missing'} | {kind: 'ok'; millimes: number} | {kind: 'invalid'};
// Shipper sends decimals as strings with up to 30 places; null/absent means "not set".
export function parseMoney(value: unknown): Money {
 if (value === null || value === undefined || value === '') return {kind: 'missing'};
 const millimes = units(value, 1000);
 return millimes === null ? {kind: 'invalid'} : {kind: 'ok', millimes};
}
export type PriceInputs = {accountPrice: number | null; recommendedPrice: number | null; cost: number | null};
export type PriceDecision = {price: number | null; basis: PriceBasis | null; belowCost: boolean};
// Priority: the price set on our account, then a supplier recommendation, then
// (only when enabled) a provisional price derived from cost. Cost itself is never
// returned as a price, and a price is never zero or non-positive.
export function choosePrice(input: PriceInputs, config: ImportConfig): PriceDecision {
 const {accountPrice, recommendedPrice, cost} = input;
 const known = cost !== null && cost > 0;
 let price: number | null = null, basis: PriceBasis | null = null;
 if (accountPrice !== null && accountPrice > 0) [price, basis] = [accountPrice, 'account'];
 else if (recommendedPrice !== null && recommendedPrice > 0) [price, basis] = [recommendedPrice, 'supplier_recommended'];
 else if (config.provisional.enabled && known) {
  const {markupPct, roundingMillimes, minMarginMillimes} = config.provisional;
  const target = Math.max(cost! * (1 + markupPct / 100), cost! + minMarginMillimes);
  price = Math.ceil(target / roundingMillimes) * roundingMillimes;
  basis = 'provisional';
 }
 if (price === null || !Number.isSafeInteger(price) || price <= 0) return {price: null, basis: null, belowCost: false};
 return {price, basis, belowCost: basis !== 'provisional' && known && price <= cost!};
}

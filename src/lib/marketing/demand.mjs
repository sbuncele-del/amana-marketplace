import { createHash, timingSafeEqual } from 'node:crypto';
// Each batch has one shared anchor. Compare levels only inside the same response.
export const batches = {
  outdoor: ['air fryer', 'portable fan', 'cooler box', 'picnic blanket', 'camping chair'],
  home: ['air fryer', 'shoe rack', 'storage box', 'laundry basket', 'side table'],
  kitchen: ['air fryer', 'vegetable chopper', 'food processor', 'spin mop', 'spray mop'],
  beauty: ['air fryer', 'hot air brush', 'hair dryer', 'makeup organiser', 'makeup organizer'],
  electronics: ['air fryer', 'power bank', 'wireless earbuds', 'bluetooth speaker', 'smart watch'],
  family: ['air fryer', 'building blocks', 'baby high chair', 'booster seat', 'bubble machine'],
};
export const windows = { '7d': 'now 7-d', '30d': 'today 1-m', '90d': 'today 3-m', '12m': 'today 12-m' };
export const searchTypes = { web: '', shopping: 'froogle' };
export function parameters(batch, window, searchType) {
  if (!Object.hasOwn(batches, batch) || !Object.hasOwn(windows, window) || !Object.hasOwn(searchTypes, searchType)) throw new Error('INVALID_REQUEST');
  return { engine: 'google_trends', q: batches[batch].join(','), geo: 'ZA', date: windows[window], gprop: searchTypes[searchType], data_type: 'TIMESERIES', hl: 'en' };
}
export function evidence(payload, terms) {
  const timeline = payload?.interest_over_time?.timeline_data;
  if (!Array.isArray(timeline) || timeline.length === 0) return { status: 'unverified', series: [], summaries: [] };
  const series = timeline.map(p => ({ date: String(p.date ?? ''), timestamp: String(p.timestamp ?? ''), partial: Boolean(p.partial_data ?? p.isPartial), values: terms.map(term => {
    const v = p.values?.find(v => v.query === term);
    return { term, index: Number.isFinite(v?.extracted_value) ? v.extracted_value : null };
  }) }));
  const complete = series.filter(p => !p.partial);
  const summaries = terms.map(term => {
    const vals = complete.map(p => p.values.find(v => v.term === term)?.index).filter(v => v !== null && v !== undefined);
    const n = Math.floor(vals.length / 2);
    const avg = a => a.reduce((s, v) => s + v, 0) / a.length;
    if (n < 3) return { term, status: 'insufficient_data', points: vals.length };
    const previous = avg(vals.slice(0, n)), recent = avg(vals.slice(-n));
    return { term, status: vals.every(v => v === 0) ? 'insufficient_data' : 'observed', points: vals.length, earlierMean: previous, recentMean: recent, changePercent: previous > 0 ? Math.round((recent / previous - 1) * 100) : null, note: 'Within-window movement only. Check other windows and seasonality before calling demand sustained.' };
  });
  return { status: 'retrieved', series, summaries };
}

export function validResearchToken(header, expected, expiresAt, now = Date.now()) {
  if (!expected || expected.length < 32 || !expiresAt || !Number.isFinite(Date.parse(expiresAt)) || Date.parse(expiresAt) <= now) return false;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return false;
  const digest = s => createHash('sha256').update(s).digest();
  return timingSafeEqual(digest(header.slice(7)), digest(expected));
}

import {locales, type Locale} from '../catalogue';
import type {ContentRecord} from './content';
export type Translator = (input: {text: string; from: Locale; to: Locale; kind: 'title' | 'description'}) => Promise<string>;
const sourceOrder: Locale[] = ['fr', 'en', 'ar'];
// Fills missing locales from the best available source. Output is marked
// "machine" and "needs_review": it is held back from the storefront unless the
// operator has allowed machine translations or a person approves it.
export async function fillTranslations(record: ContentRecord, translate: Translator): Promise<{record: ContentRecord; translated: number}> {
 const out: ContentRecord = {...record, title: {...record.title}, description: {...record.description}, provenance: {...record.provenance}};
 let translated = 0;
 for (const kind of ['title', 'description'] as const) {
  const from = sourceOrder.find(l => out[kind][l]);
  if (!from) continue;
  for (const to of locales) {
   if (out[kind][to]) continue;
   const text = (await translate({text: out[kind][from], from, to, kind})).trim();
   if (!text) continue;
   out[kind][to] = text; out.provenance[to] = 'machine'; out.reviewState = 'needs_review'; translated++;
  }
 }
 return {record: out, translated};
}
const languageName: Record<Locale, string> = {en: 'English', fr: 'French', ar: 'Modern Standard Arabic'};
export function createAnthropicTranslator(opts: {apiKey: string; model?: string; fetchImpl?: typeof fetch}): Translator {
 const {apiKey, model = 'claude-haiku-5-5', fetchImpl = fetch} = opts;
 return async ({text, from, to, kind}) => {
  const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
   method: 'POST',
   headers: {'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json'},
   body: JSON.stringify({
    model, max_tokens: 1500,
    system: `Translate a product ${kind} from ${languageName[from]} to ${languageName[to]} for a Tunisian online shop. Be faithful and factual: do not add, remove or strengthen any claim; keep numbers, units, brand names and model codes unchanged. Reply with the translation only.`,
    messages: [{role: 'user', content: text}],
   }),
   signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Translation request failed (${res.status})`);
  const body: any = await res.json();
  return typeof body?.content?.[0]?.text === 'string' ? body.content[0].text : '';
 };
}

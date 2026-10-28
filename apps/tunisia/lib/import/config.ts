// Importer configuration. Every business rule is an explicit setting; nothing
// here reads supplier credentials.
export type ImportConfig = {
 perPage: number;
 maxPages: number;
 provisional: {enabled: boolean; markupPct: number; roundingMillimes: number; minMarginMillimes: number};
 blockBelowCost: boolean;
 publishMachineTranslations: boolean;
 imageHosts: string[];
 freshnessMs: number;
 budgetMs: number;
 leaseMs: number;
 // Name of a recommended-retail-price field, if Shipper provides one. Unset today: the documented API has none.
 recommendedPriceField: string | null;
};
function num(env: Record<string, string | undefined>, key: string, fallback: number, min: number, max: number) {
 const raw = env[key];
 if (raw === undefined || raw === '') return fallback;
 const value = Number(raw);
 if (!Number.isFinite(value) || value < min || value > max) throw new Error(`${key} must be a number between ${min} and ${max}`);
 return value;
}
function flag(env: Record<string, string | undefined>, key: string, fallback: boolean) {
 const raw = env[key]?.trim().toLowerCase();
 if (!raw) return fallback;
 if (['1', 'true', 'yes', 'on'].includes(raw)) return true;
 if (['0', 'false', 'no', 'off'].includes(raw)) return false;
 throw new Error(`${key} must be true or false`);
}
export function loadConfig(env: Record<string, string | undefined> = process.env): ImportConfig {
 const mode = (env.TUNISIA_PROVISIONAL_PRICING || 'off').trim().toLowerCase();
 if (!['off', 'markup'].includes(mode)) throw new Error('TUNISIA_PROVISIONAL_PRICING must be off or markup');
 const enabled = mode === 'markup';
 // No default markup: choosing a margin is a business decision, so enabling the
 // mode without one is an error rather than a silent guess.
 if (enabled && !env.TUNISIA_PROVISIONAL_MARKUP_PCT) throw new Error('TUNISIA_PROVISIONAL_MARKUP_PCT is required when provisional pricing is on');
 if (env.TUNISIA_SHIPPER_RECOMMENDED_FIELD && !/^[a-z_][a-z0-9_]*$/.test(env.TUNISIA_SHIPPER_RECOMMENDED_FIELD.trim())) throw new Error('TUNISIA_SHIPPER_RECOMMENDED_FIELD must be a plain field name');
 return {
  perPage: 100,
  maxPages: num(env, 'TUNISIA_IMPORT_MAX_PAGES', 2000, 1, 100000),
  provisional: {
   enabled,
   markupPct: enabled ? num(env, 'TUNISIA_PROVISIONAL_MARKUP_PCT', 0, 1, 1000) : 0,
   roundingMillimes: num(env, 'TUNISIA_PROVISIONAL_ROUNDING_MILLIMES', 500, 1, 100000),
   minMarginMillimes: num(env, 'TUNISIA_PROVISIONAL_MIN_MARGIN_MILLIMES', 1000, 1, 10000000),
  },
  blockBelowCost: flag(env, 'TUNISIA_BLOCK_BELOW_COST', true),
  publishMachineTranslations: flag(env, 'TUNISIA_PUBLISH_MACHINE_TRANSLATIONS', false),
  imageHosts: (env.TUNISIA_IMAGE_HOSTS || 'cdn.shipper.network').split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
  freshnessMs: num(env, 'TUNISIA_SYNC_FRESHNESS_MINUTES', 10, 1, 1440) * 60000,
  budgetMs: num(env, 'TUNISIA_SYNC_BUDGET_SECONDS', 45, 5, 280) * 1000,
  leaseMs: 120000,
  recommendedPriceField: env.TUNISIA_SHIPPER_RECOMMENDED_FIELD?.trim() || null,
 };
}

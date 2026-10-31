// Ordering opens only when every piece is in place: the switch, a database, and a way to alert staff.
// Missing any of them keeps checkout closed rather than taking orders nobody will see.
export type CodConfig = {databaseUrl: string; resendKey: string; from: string; to: string[]};

export function codConfig(env: Record<string, string | undefined>): CodConfig | null {
  if (env.TUNISIA_ORDERS_ENABLED !== 'true') return null;
  const databaseUrl = env.TUNISIA_DATABASE_URL || env.DATABASE_URL || env.POSTGRES_URL || '';
  const to = (env.TUNISIA_ORDER_ALERT_EMAIL ?? '').split(/[,;\s]+/).map(s => s.trim().toLowerCase()).filter(s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
  const resendKey = env.RESEND_API_KEY ?? '', from = (env.TUNISIA_FROM_EMAIL ?? '').trim();
  return databaseUrl && resendKey && from && to.length ? {databaseUrl, resendKey, from, to: [...new Set(to)]} : null;
}

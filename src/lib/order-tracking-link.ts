export function orderTrackingLink(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim() || value.length > 2000) return;
  try {
    const url = new URL(value.trim());
    if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
  } catch {
    return;
  }
}

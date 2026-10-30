import 'server-only';
import type {CatalogueVariant} from '@/lib/orders/checkout';

// The Perfect Dealz price for one variant right now, in rand. Recorded on the order so margin can be shown to staff.
// Returns null when the supplier site cannot be read; the order is still taken and staff are warned.
export async function supplierPrice(slug: string, variant: CatalogueVariant): Promise<number | null> {
  try {
    if (!/^[a-z0-9-]+$/i.test(slug)) return null;
    const r = await fetch(`https://perfectdealz.co.za/products/${slug}.json`, {cache: 'no-store', signal: AbortSignal.timeout(8000)});
    if (!r.ok) return null;
    const variants: {id: number; title: string; price: string}[] = (await r.json())?.product?.variants ?? [];
    const match = variants.find(s => String(s.id) === variant.id || s.title === variant.title || (s.title === 'Default Title' && variant.title === 'Standard'));
    const price = Number(match?.price);
    return Number.isFinite(price) && price > 0 ? price : null;
  } catch {
    return null;
  }
}

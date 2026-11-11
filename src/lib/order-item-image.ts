export type OrderItemPhoto = {url: string; variant: boolean};

export function orderPhotoUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value || value !== value.trim() || /[\s\\]/.test(value) || Array.from(value).some(character => character.charCodeAt(0) < 32)) return;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
  } catch {
    return;
  }
}

export function catalogueOrderPhoto(
  product: {variants: readonly {id: string; image?: string}[]; images: readonly string[]},
  variantId: string,
): OrderItemPhoto | undefined {
  const variant = product.variants.find(item => item.id === variantId);
  if (!variant) return;
  const variantUrl = orderPhotoUrl(variant.image);
  if (variantUrl) return {url: variantUrl, variant: true};
  const productUrl = product.images.map(orderPhotoUrl).find(Boolean);
  if (productUrl) return {url: productUrl, variant: false};
}

export function savedOrderPhoto(item: {image?: unknown; variantImage?: unknown}): OrderItemPhoto | undefined {
  const url = orderPhotoUrl(item.image);
  if (url) return {url, variant: item.variantImage === true};
}

import type { CmsProduct } from "./domain";
export function applyEditorial<
  T extends {
    slug: string;
    name: string;
    description: string;
    details?: string;
    images: string[];
    category: { slug: string; name: string };
    collections: string[];
  },
>(
  base: T[],
  products: CmsProduct[],
  manual: (p: Extract<CmsProduct, { source: "manual" }>) => T,
): T[] {
  const edits = new Map(products.map((p) => [p.slug, p]));
  const rows = base
    .filter((p) => edits.get(p.slug)?.status !== "archived")
    .map((p) => {
      const edit = edits.get(p.slug);
      if (!edit || edit.source !== "supplier") return p;
      return {
        ...p,
        name: edit.name,
        description: edit.description,
        details: edit.details,
        images: edit.images,
        collections: edit.collections,
        category: { slug: edit.category, name: edit.category },
      };
    });
  for (const product of products)
    if (product.source === "manual" && product.status === "active")
      rows.push(manual(product));
  return rows;
}

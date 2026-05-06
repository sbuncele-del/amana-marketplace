import type { Metadata } from "next";
import { getProduct } from "@/lib/shopify";
import ProductPageClient from "./product-client";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://primesources.online";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    if (!product) return { title: "Product Not Found" };

    const image = product.images?.[0]?.url;
    const description =
      product.description?.slice(0, 160) ||
      `Buy ${product.title} from Prime Sources Marketplace. Secure payments, fast shipping across Africa.`;

    return {
      title: product.title,
      description,
      keywords: [product.title, product.vendor, product.productType, "buy online Africa", "Prime Sources", ...product.tags.slice(0, 5)].filter(Boolean) as string[],
      openGraph: {
        type: "website",
        title: `${product.title} — Prime Sources`,
        description,
        url: `${siteUrl}/product/${slug}`,
        images: image ? [{ url: image, alt: product.title }] : [],
        siteName: "Prime Sources Marketplace",
      },
      twitter: { card: "summary_large_image", title: `${product.title} — Prime Sources`, description, images: image ? [image] : [] },
      alternates: { canonical: `${siteUrl}/product/${slug}` },
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let jsonLd: string | null = null;
  try {
    const product = await getProduct(slug);
    if (product) {
      const price = parseFloat(product.priceRange.minVariantPrice.amount);
      const currency = product.priceRange.minVariantPrice.currencyCode;
      const image = product.images?.[0]?.url;
      jsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: product.description,
        image: image ?? undefined,
        brand: { "@type": "Brand", name: product.vendor },
        offers: {
          "@type": "Offer",
          priceCurrency: currency,
          price: price.toFixed(2),
          availability: product.availableForSale ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          url: `${siteUrl}/product/${slug}`,
          seller: { "@type": "Organization", name: "Prime Sources" },
        },
        ...(product.tags.length > 0 && { keywords: product.tags.join(", ") }),
      });
    }
  } catch { /* JSON-LD is optional */ }

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}
      <ProductPageClient />
    </>
  );
}

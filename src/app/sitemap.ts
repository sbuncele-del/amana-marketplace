import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://primesources.online";

const staticPages: MetadataRoute.Sitemap = [
  { url: siteUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
  { url: `${siteUrl}/browse`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
  { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  { url: `${siteUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  { url: `${siteUrl}/help`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  { url: `${siteUrl}/how-escrow-works`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  { url: `${siteUrl}/buyer-protection`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  { url: `${siteUrl}/shipping-guide`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  { url: `${siteUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  { url: `${siteUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  { url: `${siteUrl}/login`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  { url: `${siteUrl}/register`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
];

async function getShopifyProducts(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(
      `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/2026-04/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token":
            process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || "",
        },
        body: JSON.stringify({
          query: `{
            products(first: 250) {
              edges {
                node {
                  handle
                  updatedAt
                }
              }
            }
          }`,
        }),
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (
      data?.data?.products?.edges?.map(
        ({ node }: { node: { handle: string; updatedAt: string } }) => ({
          url: `${siteUrl}/product/${node.handle}`,
          lastModified: new Date(node.updatedAt),
          changeFrequency: "daily" as const,
          priority: 0.8,
        })
      ) ?? []
    );
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const productPages = await getShopifyProducts();
  return [...staticPages, ...productPages];
}

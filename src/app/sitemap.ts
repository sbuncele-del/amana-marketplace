import {getCatalogueSnapshot} from "@/lib/catalogue";
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 return [...staticPages, ...getCatalogueSnapshot().map(product => ({url: `${siteUrl}/product/${product.slug}`, changeFrequency: "weekly" as const, priority: 0.8}))];
}

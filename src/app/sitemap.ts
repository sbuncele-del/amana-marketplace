import {getCatalogueSnapshot} from "@/lib/catalogue";
import departments from "@/data/departments.json";
import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://primesources.online";

const staticPages: MetadataRoute.Sitemap = ['', '/browse', '/about', '/contact', '/shipping-faq', '/returns', '/terms', '/privacy'].map(path=>({url:siteUrl+path,changeFrequency:'weekly',priority:path?0.6:1}));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
 return [...staticPages, ...departments.map(d=>({url:`${siteUrl}/department/${d.slug}`,changeFrequency:"daily" as const,priority:0.9})), ...getCatalogueSnapshot().map(product => ({url: `${siteUrl}/product/${product.slug}`, changeFrequency: "weekly" as const, priority: 0.8}))];
}

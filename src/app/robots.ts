import {siteUrl} from '@/lib/site';
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/account", "/cart", "/login", "/register", "/orders/", "/dashboard/", "/admin/", "/checkout/", "/operations", "/experience-preview"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      ...["/delivery","/shipping","/faq"].map(source=>({source,destination:"/shipping-faq",permanent:true})),
      {
      source: "/:path*",
      has: [{ type: "host", value: "www.plentovo.com" }],
      destination: "https://plentovo.com/:path*",
      permanent: true,
    }];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/algeria", destination: "https://plentovo-algeria.vercel.app/algeria" },
        { source: "/algeria/:path*", destination: "https://plentovo-algeria.vercel.app/algeria/:path*" },
        { source: "/tunisia", destination: "https://plentovo-tunisia.vercel.app/tunisia" },
        { source: "/tunisia/:path*", destination: "https://plentovo-tunisia.vercel.app/tunisia/:path*" },
      ],
    };
  },
  images: {
    // Serve source images while the Vercel optimiser returns billing-related 402s.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;

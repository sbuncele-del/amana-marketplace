import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [{
      source: "/:path*",
      has: [{ type: "host", value: "www.plentovo.com" }],
      destination: "https://plentovo.com/:path*",
      permanent: true,
    }];
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

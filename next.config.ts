import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "https://*.space-z.ai",
    "http://*.space-z.ai",
  ],
  // Security headers are set in src/middleware.ts (single source of truth)
  // to avoid duplication between next.config headers() and middleware.
};

export default nextConfig;

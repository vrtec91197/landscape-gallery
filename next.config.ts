import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 828, 1080, 1200, 1920, 2048],
    imageSizes: [128, 256, 384, 512],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  serverExternalPackages: ["better-sqlite3", "sharp", "exifr"],
  output: "standalone",
  experimental: {
    middlewareClientMaxBodySize: "100mb",
  },
};

export default nextConfig;

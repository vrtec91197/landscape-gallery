import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  serverExternalPackages: ["better-sqlite3", "sharp"],
  output: "standalone",
};

export default nextConfig;

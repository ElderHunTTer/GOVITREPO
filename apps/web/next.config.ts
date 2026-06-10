import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co"
      }
    ]
  },
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: ["@govit/core", "@govit/types"]
};

export default nextConfig;

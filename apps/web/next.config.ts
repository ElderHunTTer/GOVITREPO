import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: ["@govit/core", "@govit/types"]
};

export default nextConfig;

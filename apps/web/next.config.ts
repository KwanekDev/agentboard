import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@agentboard/core"],
  outputFileTracingRoot: path.join(process.cwd(), ".."),
  async redirects() {
    return [{ source: "/", destination: "/board", permanent: true }];
  }
};

export default nextConfig;

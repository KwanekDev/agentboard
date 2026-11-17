import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@agentboard/core"],
  outputFileTracingRoot: path.join(process.cwd(), "..")
};

export default nextConfig;

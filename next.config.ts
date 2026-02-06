import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/website',
  assetPrefix: '/website',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

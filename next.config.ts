import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Disable API routes for static export
  // The AI chatbot will need a separate backend service
};

export default nextConfig;

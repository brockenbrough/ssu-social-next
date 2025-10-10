import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
};

module.exports = {
  async rewrites() {
    return [
      { source: "/message/generate", destination: "/api/message/generate" },
      { source: "/message/generate/:path*", destination: "/api/message/generate/:path*" },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
};

module.exports = {
  async rewrites() {
    return [
      { source: "/message/generate", destination: "/api/message/generate" },
      { source: "/message/generate/:path*", destination: "/api/message/generate/:path*" },

      // Legacy casing for chatRoom endpoints used by the frontend
      { source: "/api/chatRoom", destination: "/api/chatroom" },
      { source: "/api/chatRoom/getByUserId/:userId", destination: "/api/chatroom/getByUserId?userId=:userId" },
    ];
  },
};

export default nextConfig;

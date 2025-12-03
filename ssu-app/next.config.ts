import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  // Silence the multi-lockfile workspace-root warning
  outputFileTracingRoot: path.join(__dirname),

  // Add this webpack fallback to handle Node-only modules
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'webworker-threads': false,
      'aws4': false,
    };
    return config;
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: "*" },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
          { key: 'Vary', value: 'Origin' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: "*" },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
          { key: 'Vary', value: 'Origin' },
        ],
      },
      {
        source: '/_next/image',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: "*" },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
          { key: 'Vary', value: 'Origin' },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: "*" },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
          { key: 'Vary', value: 'Origin' },
        ],
      },
      {
        source: '/socket.io/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: "*" },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
          { key: 'Vary', value: 'Origin' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/api/followers/", destination: "/api/followers" },
      { source: "/api/following/", destination: "/api/following" },
      { source: "/message/generate", destination: "/api/message/generate" },
      { source: "/message/generate/:path*", destination: "/api/message/generate/:path*" },
      // Legacy casing support: map lowercase to canonical uppercase path
      { source: "/api/chatroom", destination: "/api/chatRoom" },
      { source: "/api/chatroom/getByUserId/:userId", destination: "/api/chatRoom/getByUserId/:userId" },
      // Support older frontend hitting /api/likes/unLike (capital L)
      { source: "/api/likes/unLike", destination: "/api/likes/unlike" },
      // Proxy Socket.IO requests to external WebSocket server (always active if SOCKET_SERVER_ORIGIN is set)
      ...(process.env.SOCKET_SERVER_ORIGIN
        ? [{ source: "/socket.io/:path*", destination: `${process.env.SOCKET_SERVER_ORIGIN}/socket.io/:path*` }]
        : []
      ),
    ];
  },
};
export default nextConfig;

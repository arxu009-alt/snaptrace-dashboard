import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'snaptrace-dashboard.vercel.app',
          },
        ],
        destination: 'https://snaptrace.space/:path*',
        permanent: true, // Permanent 308/301 redirect for Google and all traffic
      },
    ];
  },
};

export default nextConfig;
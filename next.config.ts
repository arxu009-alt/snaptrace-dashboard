import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/impressum',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/imprint',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/about-us',
        destination: '/about',
        permanent: true,
      },
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
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Required for Amplify server-side auth
  experimental: {
    serverComponentsExternalPackages: ['aws-amplify'],
  },
};

export default nextConfig;

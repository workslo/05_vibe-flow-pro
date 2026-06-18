import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;

import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;

initOpenNextCloudflareForDev();

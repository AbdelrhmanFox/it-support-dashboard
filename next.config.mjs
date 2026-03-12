/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Avoid corrupted chunk references (e.g. "Cannot find module './481.js'") on sync/OneDrive paths
  webpack: (config, { dev, isServer }) => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;

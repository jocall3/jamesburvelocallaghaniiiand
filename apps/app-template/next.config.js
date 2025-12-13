/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Add any custom webpack configuration here if needed
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Example: Add a custom loader
    // config.module.rules.push({
    //   test: /\.svg$/,
    //   use: ['@svgr/webpack'],
    // });

    return config;
  },
  // Add any custom rewrites or redirects here if needed
  async rewrites() {
    return [
      // Example: Redirect all requests to /old-page to /new-page
      // {
      //   source: '/old-page',
      //   destination: '/new-page',
      // },
    ];
  },
  async redirects() {
    return [
      // Example: Redirect all requests to /old-path to /new-path
      // {
      //   source: '/old-path',
      //   destination: '/new-path',
      //   permanent: true,
      // },
    ];
  },
  // Add any environment variables here if needed
  env: {
    // Example: API_URL: process.env.API_URL,
  },
  // Add any images configuration here if needed
  images: {
    domains: [], // Add any allowed image domains here
  },
  // Experimental features
  experimental: {
    // Enables the styled-components SWC transform
    // styledComponents: true
  },
};

module.exports = nextConfig;
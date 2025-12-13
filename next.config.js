/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for identifying potential problems in an application.
  reactStrictMode: true,

  // Use SWC for minification, which is significantly faster than Terser.
  swcMinify: true,

  // Configure image optimization.
  images: {
    // Define remote patterns for external images. This is more secure than 'domains'.
    // Add your allowed image hosts here.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com', // Replace with your actual image host
        port: '',
        pathname: '/my-images/**', // Adjust path as needed
      },
      {
        protocol: 'https',
        hostname: 'another-cdn.com', // Another example
      },
      // Add more patterns as needed for any external image sources
    ],
    // Define device sizes for responsive images.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Define image sizes for responsive images.
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Specify preferred image formats.
    formats: ['image/avif', 'image/webp'],
  },

  // Environment variables that are exposed to the browser.
  // These are typically prefixed with NEXT_PUBLIC_ in .env files.
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
    // Add other public environment variables here, e.g.:
    // NEXT_PUBLIC_ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID,
  },

  // Custom webpack configuration.
  // This allows you to extend or override Next.js's default webpack setup.
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Example: Add a custom loader for SVG files
    // config.module.rules.push({
    //   test: /\.svg$/,
    //   use: ['@svgr/webpack'],
    // });

    // Important: return the modified config
    return config;
  },

  // Compiler options for Next.js.
  compiler: {
    // Remove console.log, console.warn, console.error in production builds.
    // This helps keep your production bundle clean.
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
    // If using styled-components, uncomment the following:
    // styledComponents: true,
    // If using Emotion, uncomment the following:
    // emotion: true,
  },

  // Output options for standalone builds (e.g., for Docker).
  // This creates a `.next/standalone` folder with all necessary files.
  output: 'standalone',

  // Optional: Add custom headers for all routes.
  // async headers() {
  //   return [
  //     {
  //       source: '/(.*)',
  //       headers: [
  //         {
  //           key: 'X-Frame-Options',
  //           value: 'DENY',
  //         },
  //         {
  //           key: 'X-Content-Type-Options',
  //           value: 'nosniff',
  //         },
  //         {
  //           key: 'Referrer-Policy',
  //           value: 'strict-origin-when-cross-origin',
  //         },
  //       ],
  //     },
  //   ];
  // },

  // Optional: Redirects
  // async redirects() {
  //   return [
  //     {
  //       source: '/old-path',
  //       destination: '/new-path',
  //       permanent: true, // true for 308, false for 307
  //     },
  //   ];
  // },

  // Optional: Rewrites
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: 'https://external-api.com/:path*', // Proxy requests to an external API
  //     },
  //   ];
  // },
};

module.exports = nextConfig;
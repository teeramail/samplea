/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js configuration options here
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['upload.wikimedia.org', 'www.paypalobjects.com', 'sgp1.digitaloceanspaces.com', 'images.unsplash.com']
  },
  // Handle Node.js specific modules during client-side rendering
  webpack: (config, { isServer }) => {
    // Handle node: protocol imports
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:crypto': 'crypto',
      'node:path': 'path',
      'node:os': 'os',
      'node:events': 'events',
      'node:child_process': 'child_process',
    };
    
    if (!isServer) {
      // Don't attempt to import these packages on the client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        'detect-libc': false,
        crypto: false,
        os: false,
        path: false,
        events: false,
      };
    }
    return config;
  },
};

export default nextConfig;

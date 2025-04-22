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
    domains: ['upload.wikimedia.org', 'www.paypalobjects.com', 'sgp1.digitaloceanspaces.com']
  },
  // Handle Node.js specific modules during client-side rendering
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't attempt to import these packages on the client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        'detect-libc': false,
      };
    }
    return config;
  },
};

export default nextConfig;

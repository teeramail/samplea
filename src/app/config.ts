/**
 * Next.js configuration file for the application
 * 
 * This file contains configuration settings for Next.js pages and layouts,
 * particularly focusing on caching behavior that changes based on environment.
 */

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Export Next.js configuration options
// In development: disable caching with force-dynamic
// In production: use normal caching
export const dynamic = isDevelopment ? 'force-dynamic' : 'auto';

// Revalidation time in seconds
// In development: 0 (no cache), in production: 24 hours
export const revalidate = isDevelopment ? 0 : 86400;

// Log the current cache configuration (server-side only)
export function logCacheConfig() {
  if (typeof window === 'undefined') {
    console.log(`[Next.js Config] Environment: ${process.env.NODE_ENV}`);
    console.log(`[Next.js Config] Dynamic mode: ${dynamic}`);
    console.log(`[Next.js Config] Revalidation: ${revalidate} seconds`);
  }
}

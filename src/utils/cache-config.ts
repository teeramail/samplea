/**
 * Cache configuration utility
 * 
 * This file provides configuration for caching behavior based on the environment.
 * In development, we disable caching to see changes immediately.
 * In production, we use appropriate cache settings.
 */

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Cache configuration for fetch requests
export const fetchCacheConfig = {
  // In development: no cache, in production: cache for 24 hours
  next: {
    revalidate: isDevelopment ? 0 : 86400 // 0 means no cache, 86400 seconds = 24 hours
  }
};

// Cache configuration for React Server Components
export const rscCacheConfig = {
  // In development: always dynamic, in production: cached
  dynamic: isDevelopment ? 'force-dynamic' : 'auto',
  revalidate: isDevelopment ? 0 : 86400
};

// Cache configuration for database queries
export const dbQueryConfig = {
  // In development: no cache, in production: cache for 24 hours (in seconds)
  staleTime: isDevelopment ? 0 : 86400
};

// Helper to log cache status on server
export const logCacheStatus = () => {
  if (typeof window === 'undefined') { // Only run on server
    console.log(`[Cache Config] Environment: ${process.env.NODE_ENV}`);
    console.log(`[Cache Config] Cache disabled: ${isDevelopment}`);
    console.log(`[Cache Config] Revalidation time: ${isDevelopment ? '0 (disabled)' : '24 hours'}`);
  }
};

/**
 * Database query cache configuration utility
 * 
 * This file provides configuration for database query caching behavior based on the environment.
 * In development, we disable caching to see changes immediately.
 * In production, we use appropriate cache settings.
 */

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Cache configuration for database queries
export const dbQueryConfig = {
  // In development: no cache, in production: cache for 24 hours (in seconds)
  staleTime: isDevelopment ? 0 : 86400
};

// Helper to log database cache status on server
export const logDbCacheStatus = () => {
  if (typeof window === 'undefined') { // Only run on server
    console.log(`[DB Cache Config] Environment: ${process.env.NODE_ENV}`);
    console.log(`[DB Cache Config] Cache disabled: ${isDevelopment}`);
    console.log(`[DB Cache Config] Query stale time: ${isDevelopment ? '0 (disabled)' : '24 hours'}`);
  }
};

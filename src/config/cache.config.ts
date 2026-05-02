/**
 * Cache Configuration
 * 
 * Centralized configuration for all caching strategies.
 * Defines cache keys, TTL values, and versioning.
 */

export const CACHE_CONFIG = {
  /**
   * Cache key prefixes and versions
   */
  keys: {
    companies: 'spycity_companies',
    version: 'v6', // Increment when data schema changes
    metric: 'spycity_metric',
    profile: 'spycity_profile',
  },
  
  /**
   * Time-to-live values in milliseconds
   */
  ttl: {
    companies: 24 * 60 * 60 * 1000, // 24 hours
    metrics: 7 * 24 * 60 * 60 * 1000, // 7 days (metrics change slowly)
    profile: 30 * 24 * 60 * 60 * 1000, // 30 days (company info rarely changes)
    quote: 60 * 60 * 1000, // 1 hour (for real-time quotes)
  },
  
  /**
   * Server-side cache revalidation times (Next.js unstable_cache)
   */
  revalidate: {
    quote: 86400, // 24 hours in seconds
    metrics: 86400 * 7, // 7 days in seconds
    profile: 86400 * 7, // 7 days in seconds
  },
} as const;

/**
 * Build a versioned cache key
 */
export function buildCacheKey(type: keyof typeof CACHE_CONFIG.keys, identifier?: string): string {
  const prefix = CACHE_CONFIG.keys[type];
  const version = CACHE_CONFIG.keys.version;
  
  if (identifier) {
    return `${prefix}_${version}_${identifier}`;
  }
  
  return `${prefix}_${version}`;
}

/**
 * Check if cached data is still valid
 */
export function isCacheValid(timestamp: number, ttl: number): boolean {
  return Date.now() - timestamp < ttl;
}

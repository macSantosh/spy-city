/**
 * API Configuration
 * 
 * Centralized configuration for all API endpoints and settings.
 * Single source of truth for API URLs, timeouts, and retry logic.
 */

import { env } from './env';

export const API_CONFIG = {
  /**
   * Base URL for API calls
   * In production: empty string (same origin)
   * In development: can override with NEXT_PUBLIC_API_URL
   */
  baseURL: env.NEXT_PUBLIC_API_URL || '',
  
  /**
   * Internal API endpoints (Next.js route handlers)
   */
  endpoints: {
    quotes: '/api/quotes',
    metrics: '/api/quotes',
    profile: '/api/quotes',
  },
  
  /**
   * Request timeout in milliseconds
   */
  timeout: 30000, // 30 seconds
  
  /**
   * Number of retry attempts for failed requests
   */
  retries: 3,
  
  /**
   * Delay between retries in milliseconds
   */
  retryDelay: 1000, // 1 second
  
  /**
   * Rate limiting configuration for Finnhub free tier
   */
  rateLimit: {
    requestsPerMinute: 60,
    delayBetweenRequests: 1100, // ms - slightly over 1 second to stay under 60/min
  },
} as const;

/**
 * External API base URLs (server-side only)
 */
export const EXTERNAL_API = {
  finnhub: 'https://finnhub.io/api/v1',
  fmp: 'https://financialmodelingprep.com/api/v3',
} as const;

/**
 * Build full URL for internal API endpoint
 */
export function buildApiUrl(endpoint: keyof typeof API_CONFIG.endpoints, params?: Record<string, string>): string {
  const base = API_CONFIG.baseURL + API_CONFIG.endpoints[endpoint];
  
  if (!params || Object.keys(params).length === 0) {
    return base;
  }
  
  const queryString = new URLSearchParams(params).toString();
  return `${base}?${queryString}`;
}

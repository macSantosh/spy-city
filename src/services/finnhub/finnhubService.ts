/**
 * Finnhub Service
 * 
 * Centralized service for all Finnhub API interactions.
 * Handles quote fetching, metrics, and company profiles.
 */

import { buildApiUrl } from '@/config/api.config';
import { CACHE_CONFIG, buildCacheKey, isCacheValid } from '@/config/cache.config';
import { get } from '../api/client';
import { logger } from '@/utils/logger';
import type { 
  TickerDataResponse, 
  FinnhubProfile,
  BatchQuoteParams,
  TickerParams 
} from '../api/types';

/**
 * Finnhub Service Class
 * 
 * Provides methods for fetching stock data from Finnhub API via Next.js route handlers.
 */
export class FinnhubService {
  /**
   * Fetch quotes for multiple symbols in batch
   * 
   * @param symbols - Array of stock symbols (e.g., ['AAPL', 'MSFT'])
   * @returns Array of ticker data with quotes and metrics
   */
  async fetchQuotes(symbols: string[]): Promise<TickerDataResponse[]> {
    try {
      logger.info(`Fetching quotes for ${symbols.length} symbols`, {
        data: { count: symbols.length },
      });
      
      const url = buildApiUrl('quotes', { symbols: symbols.join(',') });
      const results = await get<TickerDataResponse[]>(url);
      
      logger.info(`Successfully fetched ${results.length} quotes`);
      return results;
      
    } catch (error) {
      logger.error('Failed to fetch quotes batch', error, {
        data: { symbolCount: symbols.length },
      });
      throw error;
    }
  }
  
  /**
   * Fetch detailed metrics for a single symbol
   * 
   * @param symbol - Stock symbol (e.g., 'AAPL')
   * @returns Ticker data with detailed metrics
   */
  async fetchMetrics(symbol: string): Promise<TickerDataResponse> {
    try {
      // Check cache first
      const cacheKey = buildCacheKey('metric', symbol);
      const cached = this.getFromCache<TickerDataResponse>(cacheKey);
      
      if (cached && isCacheValid(cached.timestamp, CACHE_CONFIG.ttl.metrics)) {
        logger.debug(`Using cached metrics for ${symbol}`);
        return cached.data;
      }
      
      logger.info(`Fetching metrics for ${symbol}`);
      
      const url = buildApiUrl('metrics', { symbols: symbol });
      const [result] = await get<TickerDataResponse[]>(url);
      
      // Cache the result
      this.setInCache(cacheKey, result, CACHE_CONFIG.ttl.metrics);
      
      return result;
      
    } catch (error) {
      logger.error(`Failed to fetch metrics for ${symbol}`, error);
      throw error;
    }
  }
  
  /**
   * Fetch company profile for a single symbol
   * 
   * @param symbol - Stock symbol (e.g., 'AAPL')
   * @returns Company profile data
   */
  async fetchProfile(symbol: string): Promise<FinnhubProfile> {
    try {
      // Check cache first
      const cacheKey = buildCacheKey('profile', symbol);
      const cached = this.getFromCache<FinnhubProfile>(cacheKey);
      
      if (cached && isCacheValid(cached.timestamp, CACHE_CONFIG.ttl.profile)) {
        logger.debug(`Using cached profile for ${symbol}`);
        return cached.data;
      }
      
      logger.info(`Fetching profile for ${symbol}`);
      
      const url = buildApiUrl('profile', { 
        symbol,
        endpoint: 'stock/profile2',
      });
      const profile = await get<FinnhubProfile>(url);
      
      // Cache the result
      this.setInCache(cacheKey, profile, CACHE_CONFIG.ttl.profile);
      
      return profile;
      
    } catch (error) {
      logger.error(`Failed to fetch profile for ${symbol}`, error);
      throw error;
    }
  }
  
  /**
   * Get data from localStorage cache
   */
  private getFromCache<T>(key: string): { data: T; timestamp: number } | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn(`Failed to read cache for key: ${key}`, { data: error });
    }
    
    return null;
  }
  
  /**
   * Set data in localStorage cache
   */
  private setInCache<T>(key: string, data: T, ttl: number): void {
    if (typeof window === 'undefined') return;
    
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      logger.warn(`Failed to write cache for key: ${key}`, { data: error });
    }
  }
}

/**
 * Singleton instance of FinnhubService
 */
export const finnhubService = new FinnhubService();

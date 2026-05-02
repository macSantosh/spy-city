'use client';

import { useEffect, useRef } from 'react';
import { useCityStore } from '@/store/cityStore';
import { FALLBACK_COMPANIES } from '@/data/companies';
import { normalizeSector } from '@/data/sectors';
import constituentsData from '@/data/constituents.json';
import type { Company } from '@/data/types';
import { finnhubService } from '@/services';
import { CACHE_CONFIG, buildCacheKey, isCacheValid } from '@/config/cache.config';
import { API_CONFIG } from '@/config/api.config';
import { logger } from '@/utils/logger';

const CACHE_KEY = buildCacheKey('companies');

export function useCompanyData() {
  const setCompanies = useCityStore((s) => s.setCompanies);
  const setLoading = useCityStore((s) => s.setLoading);
  const companies = useCityStore((s) => s.companies);
  const loading = useCityStore((s) => s.loading);
  const fetchStarted = useRef(false);

  useEffect(() => {
    if (fetchStarted.current) return;
    fetchStarted.current = true;

    let cachedData: Company[] | null = null;
    
    // Layer 2: LocalStorage cache
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as { ts: number; data: Company[] };
        if (isCacheValid(cached.ts, CACHE_CONFIG.ttl.companies) && cached.data.length > 0) {
          logger.info(`Valid cache found for ${cached.data.length} companies. Skipping network fetch.`);
          cachedData = cached.data;
          setCompanies(cachedData);
          setLoading(false);
          // If fresh valid cache exists, we abort fetching completely to respect zero-infra goals
          return;
        }
      }
    } catch {
      // Cache miss or parse error
    }

    // Layer 3: Serve fallback immediately so city is never blank
    if (!cachedData) {
      logger.info('No valid cache. Seeding with FALLBACK_COMPANIES (50 companies).');
      setCompanies(FALLBACK_COMPANIES);
    }

    // Layer 1: Server Fetches
    async function fetchLive() {
      try {
        logger.info(`Loaded ${constituentsData.length} constituents directly from JSON.`);

        // Seed current companies with JSON data + fallback data for sizing mid-load
        let currentCompanies: Company[] = (constituentsData as any[]).map((co) => {
          const fallback = FALLBACK_COMPANIES.find((f) => f.ticker === co.Symbol);
          return {
            ticker: co.Symbol,
            name: co.Security,
            sector: normalizeSector(co['GICS Sector']),
            marketCap: fallback?.marketCap || 10,
            price: fallback?.price || 0,
            change: fallback?.change || 0,
          };
        });
        // Render the true 500 buildings sized initially to 10 (except fallbacks)
        setCompanies(currentCompanies);

        // Fetch quotes 1-by-1 to stay beneath Finnhub's strict 60/min free limit
        const tickers = currentCompanies.map((c) => c.ticker);
        logger.info(`Began progressive Finnhub quote fetching for ${tickers.length} tickers at 1 call per ${API_CONFIG.rateLimit.delayBetweenRequests}ms...`);

        for (let i = 0; i < tickers.length; i++) {
          const ticker = tickers[i];
          try {
            const [batchData] = await finnhubService.fetchQuotes([ticker]);
            
            currentCompanies = [...currentCompanies]; // copy reference
            
            if (batchData && batchData.quote) {
              const idx = currentCompanies.findIndex((c) => c.ticker === batchData.symbol);
              if (idx !== -1) {
                const price = batchData.quote.c || 0;
                
                // Merge quote data + extended financial metrics for value score calculation
                currentCompanies[idx] = {
                  ...currentCompanies[idx],
                  // Merge extended metrics first (includes marketCapFromAPI)
                  ...(batchData.extendedMetrics || {}),
                  // Then override with quote data
                  price: price,
                  change: batchData.quote.dp || 0,
                  // Use API market cap if available, otherwise keep existing
                  marketCap: batchData.extendedMetrics?.marketCapFromAPI || currentCompanies[idx].marketCap,
                };
              }
            }

            // Visually update the city with true values occasionally to batch renders
            if (i % 5 === 0 || i === tickers.length - 1) {
              setCompanies(currentCompanies);
              localStorage.setItem(
                CACHE_KEY,
                JSON.stringify({ ts: Date.now(), data: currentCompanies })
              );
            }
          } catch (e) {
            logger.warn(`Ticker ${ticker} quote fetch failed`, { data: e });
          }

          // Strict Finnhub 60/min free tier rate limit
          if (i < tickers.length - 1) {
            await new Promise((r) => setTimeout(r, API_CONFIG.rateLimit.delayBetweenRequests));
          }
        }
        logger.info('All quotes fully downloaded and cached.');
      } catch (err) {
        logger.warn('Live fetch failed entirely, keeping fallback state', { data: err });
      } finally {
        setLoading(false);
      }
    }

    fetchLive();
  }, [setCompanies, setLoading]);

  return { companies, loading };
}

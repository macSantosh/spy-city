'use client';

import { useEffect, useRef } from 'react';
import { useCityStore } from '@/store/cityStore';
import { FALLBACK_COMPANIES } from '@/data/companies';
import { normalizeSector } from '@/data/sectors';
import constituentsData from '@/data/constituents.json';
import type { Company } from '@/data/types';
import { fetchWithRetry } from '@/util/fetchWithRetry';

const CACHE_KEY = 'spycity_v6'; // v6: Bust cache after fixing 503 API error
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

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
        if (Date.now() - cached.ts < CACHE_TTL && cached.data.length > 0) {
          console.log(`[useCompanyData] Valid cache found for ${cached.data.length} companies. Skipping network fetch.`);
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
      console.log('[useCompanyData] No valid cache. Seeding with FALLBACK_COMPANIES (50 companies).');
      setCompanies(FALLBACK_COMPANIES);
    }

    // Layer 1: Server Fetches
    async function fetchLive() {
      try {
        console.log(`[useCompanyData] Loaded ${constituentsData.length} constituents directly from JSON.`);

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
        console.log(`[useCompanyData] Began progressive Finnhub quote fetching for ${tickers.length} tickers at 1 call per 1100ms...`);

        for (let i = 0; i < tickers.length; i++) {
          const chunk = tickers[i];
          try {
            const batchRes = await fetchWithRetry(`/api/quotes?symbols=${chunk}`);
            if (batchRes.ok) {
              const batchData = await batchRes.json();
              
              currentCompanies = [...currentCompanies]; // copy reference
              
              batchData.forEach((res: any) => {
                const idx = currentCompanies.findIndex((c) => c.ticker === res.symbol);
                if (idx !== -1 && res.quote) {
                  const price = res.quote.c || 0;
                  
                  // Merge quote data + extended financial metrics for value score calculation
                  currentCompanies[idx] = {
                    ...currentCompanies[idx],
                    // Merge extended metrics first (includes marketCapFromAPI)
                    ...(res.extendedMetrics || {}),
                    // Then override with quote data
                    price: price,
                    change: res.quote.dp || 0,
                    // Use API market cap if available, otherwise keep existing
                    marketCap: res.extendedMetrics?.marketCapFromAPI || currentCompanies[idx].marketCap,
                  };
                }
              });

              // Visually update the city with true values occasionally to batch renders
              if (i % 5 === 0 || i === tickers.length - 1) {
                setCompanies(currentCompanies);
                localStorage.setItem(
                  CACHE_KEY,
                  JSON.stringify({ ts: Date.now(), data: currentCompanies })
                );
              }
            }
          } catch (e) {
            console.warn(`Ticker ${chunk} quote fetch failed`, e);
          }

          // Strict Finnhub 60/min free tier rate limit: wait 1100ms between calls
          if (i < tickers.length - 1) {
            await new Promise((r) => setTimeout(r, 1100));
          }
        }
        console.log('[useCompanyData] All quotes fully downloaded and cached.');
      } catch (err) {
        console.warn('Live fetch failed entirely, keeping fallback state', err);
      } finally {
        setLoading(false);
      }
    }

    fetchLive();
  }, [setCompanies, setLoading]);

  return { companies, loading };
}

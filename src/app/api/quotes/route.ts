import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { env } from '@/config/env';
import { EXTERNAL_API } from '@/config/api.config';
import { CACHE_CONFIG } from '@/config/cache.config';
import { logger } from '@/utils/logger';

const FINNHUB_BASE = EXTERNAL_API.finnhub;

async function fetchTickerData(key: string, symbol: string) {
  return unstable_cache(
    async () => {
      logger.debug(`Fetching ticker data for ${symbol}`);
      
      const [quoteRes, metricRes] = await Promise.all([
        fetch(`${FINNHUB_BASE}/quote?symbol=${symbol}&token=${key}`),
        fetch(`${FINNHUB_BASE}/stock/metric?symbol=${symbol}&metric=all&token=${key}`)
      ]);
      const quote = quoteRes.ok ? await quoteRes.json() : null;
      const metric = metricRes.ok ? await metricRes.json() : null;

      // Extract extended financial metrics from Finnhub response
      const m = metric?.metric;
      const extendedMetrics = m ? {
        volume10Day: m['10DayAverageTradingVolume'],
        marketCapFromAPI: m.marketCapitalization ? m.marketCapitalization / 1000 : undefined, // millions → billions
        peRatio: m.peBasicExclExtraTTM ?? m.peNormalizedAnnual,
        eps: m.epsTTM,
        dividendYield: m.dividendYieldIndicatedAnnual,
        roe: m.roeTTM ?? m.roeRfy,
        roa: m.roaTTM ?? m.roaRfy,
        profitMargin: m.netProfitMarginTTM,
        revenuePerShare: m.revenuePerShareTTM,
        bookValue: m.bookValuePerShareAnnual,
        currentRatio: m.currentRatioAnnual,
        debtToEquity: m['totalDebt/totalEquityAnnual'],
      } : {};

      return { symbol, quote, metric, extendedMetrics };
    },
    [`finnhub-ticker-${symbol}`],
    { revalidate: CACHE_CONFIG.revalidate.quote }
  )();
}

async function fetchProfile(key: string, symbol: string) {
  return unstable_cache(
    async () => {
      logger.debug(`Fetching profile for ${symbol}`);
      const res = await fetch(`${FINNHUB_BASE}/stock/profile2?symbol=${symbol}&token=${key}`);
      return res.ok ? await res.json() : null;
    },
    [`finnhub-profile-${symbol}`],
    { revalidate: CACHE_CONFIG.revalidate.profile }
  )();
}

export async function GET(request: NextRequest) {
  // Validate API key at runtime
  const KEY = env.FINNHUB_API_KEY;
  
  if (!KEY || KEY === 'your_key_here') {
    logger.error('FINNHUB_API_KEY not configured');
    return NextResponse.json(
      { 
        error: 'API key not configured',
        message: 'FINNHUB_API_KEY is missing. Add it to .env.local',
        docs: 'https://finnhub.io/register'
      },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');
  const endpoint = searchParams.get('endpoint');
  const symbol = searchParams.get('symbol');

  try {
    // If client asks specifically for profile2:
    if (endpoint === 'stock/profile2' && symbol) {
      const profile = await fetchProfile(KEY, symbol);
      return NextResponse.json(profile);
    }

    // Batch fetch mode for quote + metrics
    if (!symbolsParam) {
      return NextResponse.json({ error: 'symbols array required for batching' }, { status: 400 });
    }

    const symbols = symbolsParam.split(',').map(s => s.trim()).filter(Boolean);
    logger.info(`Starting batch fetch for ${symbols.length} tickers`);
    
    const results = await Promise.all(symbols.map(sym => fetchTickerData(KEY, sym)));
    
    logger.info(`Finnhub batch complete for ${symbols.length} tickers`);
    return NextResponse.json(results);
  } catch (err) {
    logger.error('Finnhub API error', err);
    return NextResponse.json({ error: 'Upstream Finnhub API error' }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

async function fetchTickerData(key: string, symbol: string) {
  return unstable_cache(
    async () => {
      const [quoteRes, metricRes] = await Promise.all([
        fetch(`${FINNHUB_BASE}/quote?symbol=${symbol}&token=${key}`),
        fetch(`${FINNHUB_BASE}/stock/metric?symbol=${symbol}&metric=all&token=${key}`)
      ]);
      const quote = quoteRes.ok ? await quoteRes.json() : null;
      const metric = metricRes.ok ? await metricRes.json() : null;
      return { symbol, quote, metric };
    },
    [`finnhub-ticker-${symbol}`],
    { revalidate: 86400 } // Cache for 24h
  )();
}

async function fetchProfile(key: string, symbol: string) {
  return unstable_cache(
    async () => {
      const res = await fetch(`${FINNHUB_BASE}/stock/profile2?symbol=${symbol}&token=${key}`);
      return res.ok ? await res.json() : null;
    },
    [`finnhub-profile-${symbol}`],
    { revalidate: 86400 * 7 } // Cache for 7 days
  )();
}

export async function GET(request: NextRequest) {
  const KEY = process.env.FINNHUB_API_KEY;
  if (!KEY || KEY === 'your_key_here') {
    return NextResponse.json(
      { error: 'FINNHUB_API_KEY not configured. Add it to .env.local' },
      { status: 503 },
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
    console.log(`[Server /api/quotes] Starting batch fetch for ${symbols.length} tickers...`);
    const results = await Promise.all(symbols.map(sym => fetchTickerData(KEY, sym)));
    console.log(`[Server /api/quotes] Finnhub batch complete for ${symbols.length} tickers.`);
    return NextResponse.json(results);
  } catch (err) {
    console.error('[Server /api/quotes] Finnhub error', err);
    return NextResponse.json({ error: 'Upstream Finnhub API error' }, { status: 502 });
  }
}

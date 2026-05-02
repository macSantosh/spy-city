/**
 * API Type Definitions
 * 
 * TypeScript interfaces for API requests and responses.
 */

/**
 * Finnhub Quote Response
 */
export interface FinnhubQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

/**
 * Finnhub Metric Response
 */
export interface FinnhubMetric {
  metric: {
    '10DayAverageTradingVolume'?: number;
    '52WeekHigh'?: number;
    '52WeekLow'?: number;
    marketCapitalization?: number;
    peBasicExclExtraTTM?: number;
    peNormalizedAnnual?: number;
    epsTTM?: number;
    dividendYieldIndicatedAnnual?: number;
    beta?: number;
    roeTTM?: number;
    roeRfy?: number;
    roaTTM?: number;
    roaRfy?: number;
    netProfitMarginTTM?: number;
    revenuePerShareTTM?: number;
    bookValuePerShareAnnual?: number;
    currentRatioAnnual?: number;
    'totalDebt/totalEquityAnnual'?: number;
    [key: string]: any;
  };
}

/**
 * Finnhub Profile Response
 */
export interface FinnhubProfile {
  name: string;
  ticker: string;
  finnhubIndustry?: string;
  exchange?: string;
  ipo?: string;
  marketCapitalization?: number;
  shareOutstanding?: number;
  logo?: string;
  phone?: string;
  weburl?: string;
}

/**
 * Combined Ticker Data Response
 */
export interface TickerDataResponse {
  symbol: string;
  quote: FinnhubQuote | null;
  metric: FinnhubMetric | null;
  extendedMetrics?: {
    volume10Day?: number;
    marketCapFromAPI?: number;
    peRatio?: number;
    eps?: number;
    dividendYield?: number;
    roe?: number;
    roa?: number;
    profitMargin?: number;
    revenuePerShare?: number;
    bookValue?: number;
    currentRatio?: number;
    debtToEquity?: number;
  };
}

/**
 * Batch Quote Request Parameters
 */
export interface BatchQuoteParams {
  symbols: string[];
}

/**
 * Single Ticker Request Parameters
 */
export interface TickerParams {
  symbol: string;
  endpoint?: 'quote' | 'metric' | 'profile';
}

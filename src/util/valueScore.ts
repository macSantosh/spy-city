import type { Company } from '@/data/types';
import { calcSectorMedians, type SectorMedians } from './sectorMedians';

export interface CategoryScores {
  profitability: number; // 0-100
  value: number;         // 0-100
  health: number;        // 0-100
  growth: number;        // 0-100
}

export interface ValueScore {
  overall: number;           // 0-100 weighted average
  categories: CategoryScores;
  dataCompleteness: number;  // 0-100 percentage of available metrics
}

/**
 * Calculate percentile rank (0-100) for a value within an array.
 * Higher percentile = better performance.
 * 
 * @param value - The value to rank
 * @param allValues - All values in the comparison set
 * @param invertedMetric - If true, lower values are better (e.g., P/E ratio, debt)
 */
function percentileRank(
  value: number | undefined,
  allValues: (number | undefined)[],
  invertedMetric = false
): number {
  if (value === undefined || value === null || isNaN(value)) return 50; // Neutral if missing
  
  const valid = allValues.filter((v): v is number => 
    v !== undefined && v !== null && !isNaN(v)
  );
  
  if (valid.length === 0) return 50;
  
  let rank = 0;
  valid.forEach((v) => {
    if (invertedMetric) {
      if (v > value) rank++; // Lower is better
    } else {
      if (v < value) rank++; // Higher is better
    }
  });
  
  return Math.round((rank / valid.length) * 100);
}

/**
 * Calculate value score for a company based on fundamental analysis.
 * 
 * Scoring methodology (Warren Buffett-inspired):
 * - Profitability (25%): ROE + ROA + Profit Margin
 * - Value (25%): P/E ratio (lower is better) + Price-to-Book
 * - Financial Health (25%): Current Ratio + Debt/Equity (lower is better)
 * - Growth & Returns (25%): EPS + Revenue/Share + Dividend Yield
 * 
 * Missing metrics are filled with sector median = 50 points (neutral).
 * 
 * @param company - Company to score
 * @param allCompanies - All companies for percentile calculations
 * @param sectorMedians - Pre-calculated sector medians for imputation
 */
export function calculateValueScore(
  company: Company,
  allCompanies: Company[],
  sectorMedians: SectorMedians
): ValueScore {
  const sectorMedian = sectorMedians[company.sector] || {};
  
  // Count available metrics for completeness score
  let availableMetrics = 0;
  let totalMetrics = 11; // Total financial metrics used in scoring
  
  // Helper to get value or sector median
  const getValueOrMedian = (
    companyValue: number | undefined,
    medianValue: number | undefined
  ): number | undefined => {
    if (companyValue !== undefined && !isNaN(companyValue)) {
      availableMetrics++;
      return companyValue;
    }
    // Use sector median as neutral value if available
    return medianValue;
  };
  
  // === PROFITABILITY (25%) ===
  const roe = getValueOrMedian(company.roe, sectorMedian.roe);
  const roa = getValueOrMedian(company.roa, sectorMedian.roa);
  const profitMargin = getValueOrMedian(company.profitMargin, sectorMedian.profitMargin);
  
  const roeScore = percentileRank(roe, allCompanies.map((c) => c.roe));
  const roaScore = percentileRank(roa, allCompanies.map((c) => c.roa));
  const profitMarginScore = percentileRank(profitMargin, allCompanies.map((c) => c.profitMargin));
  
  const profitabilityScore = (roeScore + roaScore + profitMarginScore) / 3;
  
  // === VALUE (25%) ===
  const peRatio = getValueOrMedian(company.peRatio, sectorMedian.peRatio);
  const bookValue = getValueOrMedian(company.bookValue, sectorMedian.bookValue);
  
  // Calculate Price-to-Book ratio
  const priceToBook = bookValue && bookValue > 0 ? company.price / bookValue : undefined;
  
  const peScore = percentileRank(peRatio, allCompanies.map((c) => c.peRatio), true); // Lower P/E is better
  const pbScore = percentileRank(
    priceToBook,
    allCompanies.map((c) => c.bookValue && c.bookValue > 0 ? c.price / c.bookValue : undefined),
    true // Lower P/B is better
  );
  
  const valueScore = (peScore + pbScore) / 2;
  
  // === FINANCIAL HEALTH (25%) ===
  const currentRatio = getValueOrMedian(company.currentRatio, sectorMedian.currentRatio);
  const debtToEquity = getValueOrMedian(company.debtToEquity, sectorMedian.debtToEquity);
  
  const currentRatioScore = percentileRank(currentRatio, allCompanies.map((c) => c.currentRatio));
  const debtScore = percentileRank(debtToEquity, allCompanies.map((c) => c.debtToEquity), true); // Lower debt is better
  
  const healthScore = (currentRatioScore + debtScore) / 2;
  
  // === GROWTH & RETURNS (25%) ===
  const eps = getValueOrMedian(company.eps, sectorMedian.eps);
  const revenuePerShare = getValueOrMedian(company.revenuePerShare, sectorMedian.revenuePerShare);
  const dividendYield = getValueOrMedian(company.dividendYield, sectorMedian.dividendYield);
  
  const epsScore = percentileRank(eps, allCompanies.map((c) => c.eps));
  const revenueScore = percentileRank(revenuePerShare, allCompanies.map((c) => c.revenuePerShare));
  const dividendScore = percentileRank(dividendYield, allCompanies.map((c) => c.dividendYield));
  
  const growthScore = (epsScore + revenueScore + dividendScore) / 3;
  
  // === OVERALL SCORE (weighted average) ===
  const overallScore = Math.round(
    profitabilityScore * 0.25 +
    valueScore * 0.25 +
    healthScore * 0.25 +
    growthScore * 0.25
  );
  
  // Data completeness percentage
  const dataCompleteness = Math.round((availableMetrics / totalMetrics) * 100);
  
  return {
    overall: overallScore,
    categories: {
      profitability: Math.round(profitabilityScore),
      value: Math.round(valueScore),
      health: Math.round(healthScore),
      growth: Math.round(growthScore),
    },
    dataCompleteness,
  };
}

/**
 * Calculate value scores for all companies.
 * This should be called whenever the companies array updates.
 * 
 * @param companies - All companies with financial data
 * @returns Map of ticker → ValueScore
 */
export function calculateAllValueScores(companies: Company[]): Map<string, ValueScore> {
  const sectorMedians = calcSectorMedians(companies);
  const scores = new Map<string, ValueScore>();
  
  companies.forEach((company) => {
    const score = calculateValueScore(company, companies, sectorMedians);
    scores.set(company.ticker, score);
  });
  
  return scores;
}

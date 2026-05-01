import type { Company } from '@/data/types';

export interface SectorMedians {
  [sector: string]: {
    volume10Day?: number;
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
 * Calculate median value for an array of numbers, filtering out undefined/null
 */
function median(values: (number | undefined)[]): number | undefined {
  const valid = values.filter((v): v is number => v !== undefined && v !== null && !isNaN(v));
  if (valid.length === 0) return undefined;
  
  const sorted = [...valid].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Calculate sector medians for all financial metrics.
 * Used to fill missing data with sector-neutral values.
 * 
 * @param companies - Array of all companies with financial data
 * @returns Object mapping sector → metric medians
 */
export function calcSectorMedians(companies: Company[]): SectorMedians {
  const sectorGroups: { [sector: string]: Company[] } = {};
  
  // Group companies by sector
  companies.forEach((company) => {
    if (!sectorGroups[company.sector]) {
      sectorGroups[company.sector] = [];
    }
    sectorGroups[company.sector].push(company);
  });
  
  // Calculate median for each metric per sector
  const medians: SectorMedians = {};
  
  Object.keys(sectorGroups).forEach((sector) => {
    const companiesInSector = sectorGroups[sector];
    
    medians[sector] = {
      volume10Day: median(companiesInSector.map((c) => c.volume10Day)),
      peRatio: median(companiesInSector.map((c) => c.peRatio)),
      eps: median(companiesInSector.map((c) => c.eps)),
      dividendYield: median(companiesInSector.map((c) => c.dividendYield)),
      roe: median(companiesInSector.map((c) => c.roe)),
      roa: median(companiesInSector.map((c) => c.roa)),
      profitMargin: median(companiesInSector.map((c) => c.profitMargin)),
      revenuePerShare: median(companiesInSector.map((c) => c.revenuePerShare)),
      bookValue: median(companiesInSector.map((c) => c.bookValue)),
      currentRatio: median(companiesInSector.map((c) => c.currentRatio)),
      debtToEquity: median(companiesInSector.map((c) => c.debtToEquity)),
    };
  });
  
  return medians;
}

/**
 * Get a specific metric's sector median value
 */
export function getSectorMedian(
  sectorMedians: SectorMedians,
  sector: string,
  metric: keyof SectorMedians[string]
): number | undefined {
  return sectorMedians[sector]?.[metric];
}

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
  
  // Calculate medians for each sector
  const result: SectorMedians = {};
  
  Object.entries(sectorGroups).forEach(([sector, sectorCompanies]) => {
    result[sector] = {
      volume10Day: median(sectorCompanies.map((c) => c.volume10Day)),
      peRatio: median(sectorCompanies.map((c) => c.peRatio)),
      eps: median(sectorCompanies.map((c) => c.eps)),
      dividendYield: median(sectorCompanies.map((c) => c.dividendYield)),
      roe: median(sectorCompanies.map((c) => c.roe)),
      roa: median(sectorCompanies.map((c) => c.roa)),
      profitMargin: median(sectorCompanies.map((c) => c.profitMargin)),
      revenuePerShare: median(sectorCompanies.map((c) => c.revenuePerShare)),
      bookValue: median(sectorCompanies.map((c) => c.bookValue)),
      currentRatio: median(sectorCompanies.map((c) => c.currentRatio)),
      debtToEquity: median(sectorCompanies.map((c) => c.debtToEquity)),
    };
  });
  
  return result;
}

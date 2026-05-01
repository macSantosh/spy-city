export interface Company {
  ticker: string;       // 'AAPL'
  name: string;         // 'Apple Inc.'
  marketCap: number;    // billions USD — e.g. 3200
  price: number;        // USD per share — e.g. 228.52
  change: number;       // daily % change, signed — e.g. 1.23 or -0.45
  sector: string;       // must match a key in SECTOR_COLORS

  // Stage 3+ fields — populated from Finnhub endpoints
  beta?: number;        // volatility vs S&P 500, e.g. 1.24
  shares?: number;      // shares outstanding in billions
  week52High?: number;  // USD
  week52Low?: number;   // USD
  exchange?: string;    // 'NASDAQ' | 'NYSE'
}

export interface BuildingDims {
  h: number;            // height in world units
  b: number;            // base width = base depth (square footprint)
}

export interface BuildingRef {
  company: Company;
  position: [number, number, number]; // world XYZ of group origin at ground level
  dims: BuildingDims;
}

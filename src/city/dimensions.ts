import type { BuildingDims } from '@/data/types';

export const MAX_BASE = 20;

/**
 * Map market cap to building dimensions.
 */
export function calcDims(mcap: number, maxMcap: number): BuildingDims {
  const logRatio = Math.log(mcap) / Math.log(maxMcap);
  const h = Math.max(8, logRatio * 185);

  const bRaw = Math.sqrt(mcap / maxMcap) * 22 + 4;
  const b = Math.min(MAX_BASE, Math.max(5, bRaw));

  return { h, b };
}

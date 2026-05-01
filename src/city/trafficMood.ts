/**
 * trafficMood.ts
 * Infers a per-boulevard-segment traffic styling descriptor from the companies
 * placed near that segment.  No API calls — uses in-memory Company data only.
 *
 * Phase 2 feature: replace the fixed neutral mood in BoulevardTraffic with
 * computeTrafficMood() once company positions are exposed from the store.
 */

import type { BlvdInfo } from './CityLayout';
import type { Company } from '@/data/types';

export interface TrafficMood {
  dominantSector:  string | null;
  avgChange:       number;   // signed average daily % change of nearby companies
  avgAbsChange:    number;   // average |change|
  densityBias:     number;   // 0–1 additive density boost (0 = default, 1 = max boost)
  colorBias: {
    cool:  number;           // 0–1 blue-white tint (technology-heavy corridors)
    green: number;           // 0–1 green tint (positive local market)
    red:   number;           // 0–1 red tint   (negative local market)
  };
}

/** How far from a boulevard centre-line (world units) to consider a building "adjacent". */
const ADJACENCY_RADIUS = 60;

/** |change|% threshold that drives maximum density bias. */
const MAX_ABS_CHANGE = 5;

/** Signed change% magnitude that saturates the green/red tint. */
const TINT_SATURATION = 3;

function neutralMood(): TrafficMood {
  return {
    dominantSector: null,
    avgChange:       0,
    avgAbsChange:    0,
    densityBias:     0,
    colorBias: { cool: 0.15, green: 0, red: 0 },
  };
}

/**
 * Compute the traffic mood for a boulevard given a list of (company, worldPosition) pairs.
 *
 * @param blvd         The boulevard axis descriptor from CityLayout.getBoulevardAxes()
 * @param entries      Array of { company, cx, cz } — the placed company world positions
 */
export function computeTrafficMood(
  blvd:    BlvdInfo,
  entries: Array<{ company: Company; cx: number; cz: number }>,
): TrafficMood {
  // Filter to buildings within adjacency radius of this boulevard
  const nearby = entries.filter(({ cx, cz }) => {
    const dist = blvd.fixedAxis === 'x'
      ? Math.abs(cx - blvd.worldFixed)
      : Math.abs(cz - blvd.worldFixed);
    return dist < ADJACENCY_RADIUS;
  });

  if (nearby.length === 0) return neutralMood();

  // Dominant sector (mode)
  const sectorCount: Record<string, number> = {};
  for (const { company } of nearby) {
    sectorCount[company.sector] = (sectorCount[company.sector] ?? 0) + 1;
  }
  const dominantSector =
    Object.entries(sectorCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Average signed & absolute change
  const avgChange =
    nearby.reduce((s, { company }) => s + company.change, 0) / nearby.length;
  const avgAbsChange =
    nearby.reduce((s, { company }) => s + Math.abs(company.change), 0) / nearby.length;

  // Density bias: calm markets → 0, volatile markets → 1
  const densityBias = Math.min(1, avgAbsChange / MAX_ABS_CHANGE);

  // Color biases (clamped 0–1, mutually exclusive for green/red)
  const cool  = dominantSector === 'Technology' ? 0.65 : 0.15;
  const green = avgChange > 0 ? Math.min(1, avgChange / TINT_SATURATION)  : 0;
  const red   = avgChange < 0 ? Math.min(1, -avgChange / TINT_SATURATION) : 0;

  return { dominantSector, avgChange, avgAbsChange, densityBias, colorBias: { cool, green, red } };
}

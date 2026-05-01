'use client';

import { useMemo } from 'react';
import { Building } from './Building';
import { calcDims } from './dimensions';
import { calcWorldPos } from './CityLayout';
import { useCityStore } from '@/store/cityStore';

// Simple deterministic seeded PRNG (LCG)
function lcg(seed: number) {
  return function() {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

// Fisher-Yates with seeded random
function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  const random = lcg(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function Buildings() {
  const companies = useCityStore((s) => s.companies);

  const { shuffled, allDims, getRank } = useMemo(() => {
    let maxMcap = 1;
    companies.forEach((co) => {
      if (co.marketCap > maxMcap) maxMcap = co.marketCap;
    });

    const shuffled = seededShuffle(companies, companies.length);
    const allDims = shuffled.map((co) => calcDims(co.marketCap, maxMcap));
    
    // Ranked map for Info Panel integration
    const sortedDesc = [...companies].sort((a, b) => b.marketCap - a.marketCap);
    const getRank = (ticker: string) => sortedDesc.findIndex((c) => c.ticker === ticker) + 1;

    return { shuffled, allDims, getRank };
  }, [companies]);

  return (
    <group>
      {shuffled.map((company, idx) => {
        // Native Superblock mathematical positioning
        const { cx, cz } = calcWorldPos(idx);

        return (
          <Building
            key={company.ticker}
            company={company}
            position={[cx, 0, cz]}
            dims={allDims[idx]}
            rank={getRank(company.ticker)}
          />
        );
      })}
    </group>
  );
}

'use client';

import { useCityStore } from '@/store/cityStore';
import { SECTOR_COLORS } from '@/data/sectors';

export function SectorLegend() {
  const companies = useCityStore((s) => s.companies);

  // Only show sectors that exist in our dataset
  const activeSectors = [...new Set(companies.map((c) => c.sector))];

  return (
    <div className="sector-legend">
      <div className="sector-legend-title">SECTOR</div>
      {activeSectors.map((sector) => (
        <div key={sector} className="sector-legend-item">
          <div
            className="sector-legend-dot"
            style={{
              background: SECTOR_COLORS[sector] ?? '#888',
              boxShadow: `0 0 6px ${SECTOR_COLORS[sector] ?? '#888'}88`,
            }}
          />
          <span>{sector}</span>
        </div>
      ))}
    </div>
  );
}

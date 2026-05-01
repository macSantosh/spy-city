'use client';

import { useCityStore } from '@/store/cityStore';

export function HUD() {
  const companies = useCityStore((s) => s.companies);

  const totalCap = companies.reduce((sum, c) => sum + c.marketCap, 0);
  const totalFormatted = `$${(totalCap / 1000).toFixed(1)}T`;

  return (
    <>
      {/* Title — top left */}
      <div className="hud-title">
        <h1>S&P 500 CITY</h1>
        <p>MARKET CAPITALIZATION · 3D VISUALIZATION</p>
      </div>

      {/* Stats — top right */}
      <div className="hud-stats">
        <div>
          COMPANIES <span className="hud-stats-value">{companies.length}</span>
        </div>
        <div>
          TOTAL CAP <span className="hud-stats-value">{totalFormatted}</span>
        </div>
      </div>

      {/* Navigation hints — bottom center */}
      <div className="hud-hint">
        <b>DRAG</b> Orbit &nbsp;·&nbsp; <b>SCROLL</b> Zoom &nbsp;·&nbsp;{' '}
        <b>W/S/A/D</b> Fly &nbsp;·&nbsp; <b>Q/E</b> Up/Down &nbsp;·&nbsp;{' '}
        <b>CLICK</b> Select &nbsp;·&nbsp; <b>ESC</b> Reset
      </div>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useCityStore } from '@/store/cityStore';
import { SECTOR_COLORS } from '@/data/sectors';
import { theme } from '@/data/theme';

export function InfoPanel() {
  const company = useCityStore((s) => s.selectedCompany);
  const companies = useCityStore((s) => s.companies);

  const [extended, setExtended] = useState<{ beta?: number, shares?: number, week52High?: number, week52Low?: number, exchange?: string } | null>(null);
  const [loadingExt, setLoadingExt] = useState(false);

  useEffect(() => {
    if (!company) return;
    
    let active = true;
    setExtended(null);
    setLoadingExt(true);

    async function fetchExtended() {
      try {
        const res = await fetch(`/api/quotes?symbols=${company?.ticker}&endpoint=profile`);
        if (!res.ok) throw new Error('Fetch Error');
        const data = await res.json();
        
        if (active && data) {
          const met = data.metric?.metric;
          const prof = data.profile;
          setExtended({
            beta: met?.beta,
            shares: met?.sharesOutstanding ? met.sharesOutstanding / 1000 : undefined,
            week52High: met?.['52WeekHigh'],
            week52Low: met?.['52WeekLow'],
            exchange: prof?.exchange
          });
        }
      } catch (err) {
        console.warn('Failed to load on-demand profile metrics', err);
      } finally {
        if (active) setLoadingExt(false);
      }
    }

    fetchExtended();
    return () => { active = false; };
  }, [company?.ticker]);

  if (!company) return null;

  const sorted = [...companies].sort((a, b) => b.marketCap - a.marketCap);
  const rank = sorted.findIndex((c) => c.ticker === company.ticker) + 1;
  const color = SECTOR_COLORS[company.sector] ?? theme.scene.building.fallback;

  const formatPrice = (p: number) =>
    p >= 100 ? `$${p.toFixed(2)}` : `$${p.toFixed(3)}`;

  const formatMarketCap = (m: number) =>
    m >= 1000 ? `$${(m / 1000).toFixed(2)}T` : `$${m}B`;

  return (
    <div className="info-panel">
      <div className="info-ticker">{company.ticker} {extended?.exchange ? <span style={{fontSize: '0.6em', opacity: 0.7}}>{extended.exchange}</span> : ''}</div>
      <div className="info-name">{company.name}</div>
      <div className="info-price">{formatPrice(company.price)}</div>
      <div className={`info-change ${company.change >= 0 ? 'positive' : 'negative'}`}>
        {company.change >= 0 ? '▲' : '▼'} {Math.abs(company.change).toFixed(2)}% Today
      </div>
      <div className="info-line">Market Cap: {formatMarketCap(company.marketCap)}</div>
      <div className="info-line">Rank #{rank} by Market Cap</div>

      {loadingExt ? (
        <>
          <div className="info-skeleton animate-pulse" style={{ width: '40%', height: '14px', background: theme.ui.skeleton, margin: '6px 0', borderRadius: '4px' }} />
          <div className="info-skeleton animate-pulse" style={{ width: '70%', height: '14px', background: theme.ui.skeleton, margin: '6px 0', borderRadius: '4px' }} />
          <div className="info-skeleton animate-pulse" style={{ width: '85%', height: '14px', background: theme.ui.skeleton, margin: '6px 0', borderRadius: '4px' }} />
        </>
      ) : (
        <>
          {extended?.beta !== undefined && (
            <div className="info-line" title="Volatility vs S&P 500">β {extended.beta.toFixed(2)}</div>
          )}
          {extended?.shares !== undefined && (
            <div className="info-line">{extended.shares.toFixed(1)}B shares outstanding</div>
          )}
          {extended?.week52High !== undefined && extended?.week52Low !== undefined && (
            <div className="info-line">
              52W: ↓ ${extended.week52Low.toFixed(2)} — ↑ ${extended.week52High.toFixed(2)}
            </div>
          )}
        </>
      )}

      <div
        className="info-sector-badge"
        style={{
          background: `${color}22`,
          color: color,
          border: `1px solid ${color}55`,
        }}
      >
        {company.sector.toUpperCase()}
      </div>
    </div>
  );
}

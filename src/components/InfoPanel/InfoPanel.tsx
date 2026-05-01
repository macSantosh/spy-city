'use client';

import { useState, useEffect } from 'react';
import { useCityStore } from '@/store/cityStore';
import { SECTOR_COLORS } from '@/data/sectors';
import { theme } from '@/data/theme';
import { calcSectorMedians } from '@/util/sectorMedians';

export function InfoPanel() {
  const company = useCityStore((s) => s.selectedCompany);
  const companies = useCityStore((s) => s.companies);
  const getValueScore = useCityStore((s) => s.getValueScore);

  const [extended, setExtended] = useState<{ 
    beta?: number;
    shares?: number;
    week52High?: number;
    week52Low?: number;
    exchange?: string;
  } | null>(null);
  const [loadingExt, setLoadingExt] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedMetrics, setExpandedMetrics] = useState<any>(null);

  useEffect(() => {
    if (!company) return;
    
    let active = true;
    setExtended(null);
    setLoadingExt(true);
    setIsExpanded(false); // Collapse when switching companies

    async function fetchExtended() {
      try {
        const res = await fetch(`/api/quotes?symbols=${company?.ticker}&endpoint=profile`);
        if (!res.ok) throw new Error('Fetch Error');
        const data = await res.json();
        
        if (active && data) {
          const met = data.metric?.metric;
          const prof = data.profile;
          const ext = data.extendedMetrics;
          
          setExtended({
            beta: met?.beta,
            shares: met?.sharesOutstanding ? met.sharesOutstanding / 1000 : undefined,
            week52High: met?.['52WeekHigh'],
            week52Low: met?.['52WeekLow'],
            exchange: prof?.exchange
          });

          // Store extended metrics for expanded view
          setExpandedMetrics(ext);
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

  const valueScore = getValueScore(company.ticker);
  const sectorMedians = calcSectorMedians(companies);
  const sectorMedian = sectorMedians[company.sector] || {};

  const formatPrice = (p: number) =>
    p >= 100 ? `$${p.toFixed(2)}` : `$${p.toFixed(3)}`;

  const formatMarketCap = (m: number) =>
    m >= 1000 ? `$${(m / 1000).toFixed(2)}T` : `$${m}B`;

  const formatMetric = (value: number | undefined, sectorMed: number | undefined, format: 'number' | 'percent' | 'currency' | 'ratio' = 'number') => {
    const isImputed = value === undefined && sectorMed !== undefined;
    const displayValue = value ?? sectorMed;
    
    if (displayValue === undefined || isNaN(displayValue)) return 'N/A';
    
    let formatted = '';
    switch (format) {
      case 'percent':
        formatted = `${displayValue.toFixed(2)}%`;
        break;
      case 'currency':
        formatted = `$${displayValue.toFixed(2)}`;
        break;
      case 'ratio':
        formatted = displayValue.toFixed(2);
        break;
      default:
        formatted = displayValue.toLocaleString();
    }
    
    return isImputed ? `${formatted} (avg)` : formatted;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.accent.green;
    if (score >= 60) return theme.accent.yellow;
    if (score >= 40) return theme.accent.orange;
    return theme.accent.red;
  };

  // Merge expanded metrics into company for display
  const displayCompany = expandedMetrics ? { ...company, ...expandedMetrics } : company;

  return (
    <div className={`info-panel ${isExpanded ? 'info-panel-expanded' : ''}`}>
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

      <button 
        className="info-details-button"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={loadingExt}
      >
        {isExpanded ? '▲ Hide Details' : '▼ View Details'}
      </button>

      {/* Expanded Section */}
      {isExpanded && !loadingExt && (
        <div className="info-expanded">
          {/* Value Score */}
          {valueScore && (
            <div className="info-section">
              <div className="info-section-title">Value Score</div>
              <div className="info-score-display">
                <span className="info-score-number" style={{ color: getScoreColor(valueScore.overall) }}>
                  {valueScore.overall}
                </span>
                <span className="info-score-label">/100</span>
              </div>
              <div className="info-score-grid">
                <div className="info-score-item">
                  <span className="info-score-cat">Profitability</span>
                  <span className="info-score-val" style={{ color: getScoreColor(valueScore.categories.profitability) }}>
                    {valueScore.categories.profitability}
                  </span>
                </div>
                <div className="info-score-item">
                  <span className="info-score-cat">Value</span>
                  <span className="info-score-val" style={{ color: getScoreColor(valueScore.categories.value) }}>
                    {valueScore.categories.value}
                  </span>
                </div>
                <div className="info-score-item">
                  <span className="info-score-cat">Health</span>
                  <span className="info-score-val" style={{ color: getScoreColor(valueScore.categories.health) }}>
                    {valueScore.categories.health}
                  </span>
                </div>
                <div className="info-score-item">
                  <span className="info-score-cat">Growth</span>
                  <span className="info-score-val" style={{ color: getScoreColor(valueScore.categories.growth) }}>
                    {valueScore.categories.growth}
                  </span>
                </div>
              </div>
              {valueScore.dataCompleteness < 80 && (
                <div className="info-completeness">Data: {valueScore.dataCompleteness}%</div>
              )}
            </div>
          )}

          {/* Fundamentals */}
          <div className="info-section">
            <div className="info-section-title">Fundamentals</div>
            <div className="info-metric">
              <span>P/E Ratio</span>
              <span>{formatMetric(displayCompany.peRatio, sectorMedian.peRatio, 'ratio')}</span>
            </div>
            <div className="info-metric">
              <span>EPS (TTM)</span>
              <span>{formatMetric(displayCompany.eps, sectorMedian.eps, 'currency')}</span>
            </div>
            <div className="info-metric">
              <span>Revenue/Share</span>
              <span>{formatMetric(displayCompany.revenuePerShare, sectorMedian.revenuePerShare, 'currency')}</span>
            </div>
            <div className="info-metric">
              <span>Book Value</span>
              <span>{formatMetric(displayCompany.bookValue, sectorMedian.bookValue, 'currency')}</span>
            </div>
          </div>

          {/* Profitability */}
          <div className="info-section">
            <div className="info-section-title">Profitability</div>
            <div className="info-metric">
              <span>ROE</span>
              <span>{formatMetric(displayCompany.roe, sectorMedian.roe, 'percent')}</span>
            </div>
            <div className="info-metric">
              <span>ROA</span>
              <span>{formatMetric(displayCompany.roa, sectorMedian.roa, 'percent')}</span>
            </div>
            <div className="info-metric">
              <span>Profit Margin</span>
              <span>{formatMetric(displayCompany.profitMargin, sectorMedian.profitMargin, 'percent')}</span>
            </div>
            <div className="info-metric">
              <span>Dividend Yield</span>
              <span>{formatMetric(displayCompany.dividendYield, sectorMedian.dividendYield, 'percent')}</span>
            </div>
          </div>

          {/* Financial Health */}
          <div className="info-section">
            <div className="info-section-title">Financial Health</div>
            <div className="info-metric">
              <span>Current Ratio</span>
              <span>{formatMetric(displayCompany.currentRatio, sectorMedian.currentRatio, 'ratio')}</span>
            </div>
            <div className="info-metric">
              <span>Debt/Equity</span>
              <span>{formatMetric(displayCompany.debtToEquity, sectorMedian.debtToEquity, 'ratio')}</span>
            </div>
            <div className="info-metric">
              <span>10-Day Volume</span>
              <span>{formatMetric(displayCompany.volume10Day, sectorMedian.volume10Day)}</span>
            </div>
          </div>
        </div>
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

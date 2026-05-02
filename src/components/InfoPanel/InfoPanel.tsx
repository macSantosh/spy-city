'use client';

import { useState, useEffect } from 'react';
import { useCityStore } from '@/store/cityStore';
import { SECTOR_COLORS } from '@/data/sectors';
import { theme } from '@/data/theme';
import { calcSectorMedians } from '@/utils/calculations';
import { finnhubService } from '@/services';

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
        if (!company) return;
        
        const data = await finnhubService.fetchMetrics(company.ticker);
        
        if (active && data) {
          const met = data.metric?.metric;
          const ext = data.extendedMetrics;
          
          setExtended({
            beta: met?.beta,
            shares: met?.sharesOutstanding ? met.sharesOutstanding / 1000 : undefined,
            week52High: met?.['52WeekHigh'],
            week52Low: met?.['52WeekLow'],
            exchange: met?.exchange
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

  // Helper to render gradient bar for scores
  const ScoreBar = ({ score, isLarge = false }: { score: number; isLarge?: boolean }) => {
    // Normalize score to 0-100 range
    const normalizedScore = Math.max(0, Math.min(100, score));
    
    // Calculate gradient color based on score (0 = red, 100 = green)
    const getGradientColor = (value: number) => {
      // Red to Orange to Yellow to Green gradient
      if (value <= 25) {
        // Red to Orange
        const t = value / 25;
        return `rgb(${255}, ${Math.floor(69 + (165 - 69) * t)}, ${Math.floor(0 + (0 - 0) * t)})`;
      } else if (value <= 50) {
        // Orange to Yellow
        const t = (value - 25) / 25;
        return `rgb(${255}, ${Math.floor(165 + (204 - 165) * t)}, ${Math.floor(0 + (0 - 0) * t)})`;
      } else if (value <= 75) {
        // Yellow to Yellow-Green
        const t = (value - 50) / 25;
        return `rgb(${Math.floor(255 - (255 - 173) * t)}, ${Math.floor(204 + (255 - 204) * t)}, ${Math.floor(0 + (47 - 0) * t)})`;
      } else {
        // Yellow-Green to Green
        const t = (value - 75) / 25;
        return `rgb(${Math.floor(173 - (173 - 34) * t)}, ${255}, ${Math.floor(47 + (139 - 47) * t)})`;
      }
    };

    const fillColor = getGradientColor(normalizedScore);
    
    return (
      <div 
        style={{
          position: 'relative',
          width: '100%',
          height: isLarge ? '24px' : '14px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '4px',
          overflow: 'hidden',
          border: '1px solid rgba(127, 219, 202, 0.15)',
        }}
      >
        {/* Gradient fill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${normalizedScore}%`,
            background: `linear-gradient(to right, 
              rgb(255, 69, 0) 0%, 
              rgb(255, 165, 0) 25%, 
              rgb(255, 204, 0) 50%, 
              rgb(173, 255, 47) 75%, 
              rgb(34, 255, 139) 100%
            )`,
            backgroundSize: `${100 / (normalizedScore / 100)}% 100%`,
            backgroundPosition: 'left center',
            transition: 'width 0.3s ease',
          }}
        />
        {/* Score number */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: isLarge ? '12px' : '9px',
            fontWeight: 700,
            color: '#ffffff',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
            zIndex: 1,
          }}
        >
          {score}
        </div>
      </div>
    );
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
              <div style={{ margin: '8px 0 10px' }}>
                <ScoreBar score={valueScore.overall} isLarge={true} />
              </div>
              <div className="info-score-grid">
                <div className="info-score-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '4px' }}>
                  <span className="info-score-cat">Profitability</span>
                  <ScoreBar score={valueScore.categories.profitability} />
                </div>
                <div className="info-score-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '4px' }}>
                  <span className="info-score-cat">Value</span>
                  <ScoreBar score={valueScore.categories.value} />
                </div>
                <div className="info-score-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '4px' }}>
                  <span className="info-score-cat">Health</span>
                  <ScoreBar score={valueScore.categories.health} />
                </div>
                <div className="info-score-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '4px' }}>
                  <span className="info-score-cat">Growth</span>
                  <ScoreBar score={valueScore.categories.growth} />
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

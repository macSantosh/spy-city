'use client';

import { useEffect } from 'react';
import type { Company } from '@/data/types';
import { useCityStore } from '@/store/cityStore';
import { calcSectorMedians } from '@/utils/calculations';
import { SECTOR_COLORS } from '@/data/sectors';
import { theme } from '@/data/theme';

interface DeepDivePanelProps {
  company: Company;
  extended: {
    beta?: number;
    shares?: number;
    week52High?: number;
    week52Low?: number;
    exchange?: string;
  } | null;
  onClose: () => void;
}

interface MetricRowProps {
  label: string;
  value: number | undefined;
  sectorMedian: number | undefined;
  format?: 'number' | 'percent' | 'currency' | 'ratio';
  invertedBar?: boolean; // If true, lower values = better (fills bar from right)
}

function MetricRow({ label, value, sectorMedian, format = 'number', invertedBar = false }: MetricRowProps) {
  const formatValue = (v: number | undefined) => {
    if (v === undefined || isNaN(v)) return 'N/A';
    
    switch (format) {
      case 'percent':
        return `${v.toFixed(2)}%`;
      case 'currency':
        return `$${v.toFixed(2)}`;
      case 'ratio':
        return v.toFixed(2);
      default:
        return v.toLocaleString();
    }
  };

  const isImputed = value === undefined && sectorMedian !== undefined;
  const displayValue = value ?? sectorMedian;
  
  // Calculate bar fill percentage (0-100) based on sector median
  let barFill = 50; // Default neutral
  if (displayValue !== undefined && sectorMedian !== undefined && sectorMedian > 0) {
    const ratio = displayValue / sectorMedian;
    if (invertedBar) {
      // Lower is better: ratio < 1 = good (green), ratio > 1 = bad (red)
      barFill = Math.max(0, Math.min(100, (2 - ratio) * 50));
    } else {
      // Higher is better: ratio > 1 = good (green), ratio < 1 = bad (red)
      barFill = Math.max(0, Math.min(100, ratio * 50));
    }
  }

  const barColor = barFill >= 50 ? theme.accent.green : theme.accent.red;

  return (
    <div className="metric-row">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ fontStyle: isImputed ? 'italic' : 'normal', opacity: isImputed ? 0.7 : 1 }}>
        {formatValue(displayValue)}
        {isImputed && <span className="metric-imputed"> (sector avg)</span>}
      </div>
      {sectorMedian !== undefined && (
        <div className="metric-bar-container">
          <div className="metric-bar" style={{ width: `${barFill}%`, background: barColor }} />
        </div>
      )}
    </div>
  );
}

export function DeepDivePanel({ company, extended, onClose }: DeepDivePanelProps) {
  const companies = useCityStore((s) => s.companies);
  const getValueScore = useCityStore((s) => s.getValueScore);
  
  const valueScore = getValueScore(company.ticker);
  const sectorMedians = calcSectorMedians(companies);
  const sectorMedian = sectorMedians[company.sector] || {};

  const color = SECTOR_COLORS[company.sector] ?? theme.scene.building.fallback;

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div className="deep-dive-backdrop" onClick={onClose} />
      
      {/* Panel */}
      <div className="deep-dive-panel">
        <div className="deep-dive-header">
          <div>
            <div className="deep-dive-ticker" style={{ color }}>{company.ticker}</div>
            <div className="deep-dive-name">{company.name}</div>
          </div>
          <button className="deep-dive-close" onClick={onClose}>✕</button>
        </div>

        {/* Value Score Breakdown */}
        {valueScore && (
          <div className="deep-dive-section">
            <div className="deep-dive-section-title">Value Score</div>
            <div className="score-overall">
              <span className="score-number" style={{ 
                color: valueScore.overall >= 80 ? theme.accent.green :
                       valueScore.overall >= 60 ? theme.accent.yellow :
                       valueScore.overall >= 40 ? theme.accent.orange :
                       theme.accent.red
              }}>
                {valueScore.overall}
              </span>
              <span className="score-label">/100</span>
            </div>
            <div className="score-breakdown">
              <div className="score-category">
                <span>Profitability</span>
                <div className="score-bar-bg">
                  <div className="score-bar" style={{ width: `${valueScore.categories.profitability}%`, background: theme.accent.green }} />
                </div>
                <span className="score-cat-num">{valueScore.categories.profitability}</span>
              </div>
              <div className="score-category">
                <span>Value</span>
                <div className="score-bar-bg">
                  <div className="score-bar" style={{ width: `${valueScore.categories.value}%`, background: theme.accent.cyan }} />
                </div>
                <span className="score-cat-num">{valueScore.categories.value}</span>
              </div>
              <div className="score-category">
                <span>Health</span>
                <div className="score-bar-bg">
                  <div className="score-bar" style={{ width: `${valueScore.categories.health}%`, background: theme.accent.blue }} />
                </div>
                <span className="score-cat-num">{valueScore.categories.health}</span>
              </div>
              <div className="score-category">
                <span>Growth</span>
                <div className="score-bar-bg">
                  <div className="score-bar" style={{ width: `${valueScore.categories.growth}%`, background: theme.accent.magenta }} />
                </div>
                <span className="score-cat-num">{valueScore.categories.growth}</span>
              </div>
            </div>
            {valueScore.dataCompleteness < 80 && (
              <div className="score-completeness">
                Data completeness: {valueScore.dataCompleteness}%
              </div>
            )}
          </div>
        )}

        {/* Fundamentals */}
        <div className="deep-dive-section">
          <div className="deep-dive-section-title">Fundamentals</div>
          <MetricRow 
            label="P/E Ratio" 
            value={company.peRatio} 
            sectorMedian={sectorMedian.peRatio}
            format="ratio"
            invertedBar
          />
          <MetricRow 
            label="EPS (TTM)" 
            value={company.eps} 
            sectorMedian={sectorMedian.eps}
            format="currency"
          />
          <MetricRow 
            label="Revenue per Share" 
            value={company.revenuePerShare} 
            sectorMedian={sectorMedian.revenuePerShare}
            format="currency"
          />
          <MetricRow 
            label="Book Value per Share" 
            value={company.bookValue} 
            sectorMedian={sectorMedian.bookValue}
            format="currency"
          />
        </div>

        {/* Profitability */}
        <div className="deep-dive-section">
          <div className="deep-dive-section-title">Profitability</div>
          <MetricRow 
            label="Return on Equity (ROE)" 
            value={company.roe} 
            sectorMedian={sectorMedian.roe}
            format="percent"
          />
          <MetricRow 
            label="Return on Assets (ROA)" 
            value={company.roa} 
            sectorMedian={sectorMedian.roa}
            format="percent"
          />
          <MetricRow 
            label="Profit Margin" 
            value={company.profitMargin} 
            sectorMedian={sectorMedian.profitMargin}
            format="percent"
          />
          <MetricRow 
            label="Dividend Yield" 
            value={company.dividendYield} 
            sectorMedian={sectorMedian.dividendYield}
            format="percent"
          />
        </div>

        {/* Financial Health */}
        <div className="deep-dive-section">
          <div className="deep-dive-section-title">Financial Health</div>
          <MetricRow 
            label="Current Ratio" 
            value={company.currentRatio} 
            sectorMedian={sectorMedian.currentRatio}
            format="ratio"
          />
          <MetricRow 
            label="Debt/Equity Ratio" 
            value={company.debtToEquity} 
            sectorMedian={sectorMedian.debtToEquity}
            format="ratio"
            invertedBar
          />
          <MetricRow 
            label="10-Day Avg Volume" 
            value={company.volume10Day} 
            sectorMedian={sectorMedian.volume10Day}
          />
          <MetricRow 
            label="Market Cap (API)" 
            value={company.marketCapFromAPI} 
            sectorMedian={undefined}
            format="currency"
          />
        </div>
      </div>
    </>
  );
}

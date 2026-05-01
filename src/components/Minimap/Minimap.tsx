'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useCityStore } from '@/store/cityStore';
import { calcWorldPos, getCityBounds } from '@/city/CityLayout';
import { SECTOR_COLORS } from '@/data/sectors';
import { theme } from '@/data/theme';

function lcg(seed: number) {
  return function() {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  const random = lcg(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const companies = useCityStore((s) => s.companies);
  const selectedTicker = useCityStore((s) => s.selectedTicker);
  const getValueScore = useCityStore((s) => s.getValueScore);
  const [dotPos, setDotPos] = useState<{ x: number; y: number } | null>(null);

  // Mirrors Buildings.tsx exact layout pipeline procedural seed
  const { shuffled, maxMcap } = useMemo(() => {
    let mx = 1;
    companies.forEach((co) => {
      if (co.marketCap > mx) mx = co.marketCap;
    });
    const shuffled = seededShuffle(companies, companies.length);
    return { shuffled, maxMcap: mx };
  }, [companies]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;

    // Utilize pure Superblock world physics dimensions
    const { width, depth } = getCityBounds();
    const mapSize = 250;
    const padding = 15;
    const usable = mapSize - padding * 2;
    const scaleX = usable / width;
    const scaleZ = usable / depth;

    let active = true;
    let selectedCoords: { x: number; y: number } | null = null;

    function draw(time: number) {
      if (!ctx || !active) return;
      ctx.clearRect(0, 0, mapSize, mapSize);

      ctx.fillStyle = 'rgba(1, 8, 20, 0.95)';
      ctx.fillRect(0, 0, mapSize, mapSize);

      shuffled.forEach((company, idx) => {
        // Native Superblock 3D mapping identically mirrors City scene positioning
        const { cx, cz } = calcWorldPos(idx);

        const px = mapSize / 2 + cx * scaleX;
        const py = mapSize / 2 + cz * scaleZ;

        const isSelected = company.ticker === selectedTicker;
        if (isSelected) {
          selectedCoords = { x: px, y: py };
        }

        ctx.beginPath();
        ctx.arc(px, py, isSelected ? 4 : 2, 0, Math.PI * 2);
        ctx.fillStyle = SECTOR_COLORS[company.sector] || '#666';

        if (!isSelected) {
          ctx.globalAlpha = Math.max(0.15, company.marketCap / maxMcap);
        } else {
          ctx.globalAlpha = 1;
        }
        ctx.fill();
        ctx.globalAlpha = 1;

        if (isSelected) {
          // Animated red pulse ring mimicking SelectionBeam Ground Ring
          const pulseAlpha = 0.3 + Math.sin(time * 0.005) * 0.4;
          ctx.beginPath();
          ctx.arc(px, py, 6 + Math.sin(time * 0.003) * 3, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 34, 0, ${pulseAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      setDotPos(selectedCoords);
      if (active) requestAnimationFrame(draw);
    }

    const token = requestAnimationFrame(draw);
    return () => {
      active = false;
      cancelAnimationFrame(token);
    };
  }, [shuffled, maxMcap, selectedTicker]);

  const selectedCo = useMemo(() => companies.find((c) => c.ticker === selectedTicker), [companies, selectedTicker]);
  const sortedDesc = [...companies].sort((a, b) => b.marketCap - a.marketCap);
  const rank = selectedCo ? sortedDesc.findIndex((c) => c.ticker === selectedCo.ticker) + 1 : 0;
  
  const valueScore = selectedCo ? getValueScore(selectedCo.ticker) : undefined;

  // Determine score badge color
  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.accent.green;
    if (score >= 60) return theme.accent.yellow;
    if (score >= 40) return theme.accent.orange;
    return theme.accent.red;
  };

  return (
    <div className="minimap-container">
      <canvas ref={canvasRef} width={250} height={250} className="minimap-canvas" />
      {selectedCo && dotPos && (
        <div className="minimap-tooltip" style={{ left: dotPos.x + 16, top: dotPos.y }}>
          <div style={{ color: SECTOR_COLORS[selectedCo.sector], fontWeight: 'bold' }}>{selectedCo.ticker}</div>
          <div className="tooltip-name">{selectedCo.name}</div>
          <div className="tooltip-price">
            ${selectedCo.price.toFixed(2)}
            <span className={selectedCo.change >= 0 ? 'positive' : 'negative'}>
              ({selectedCo.change >= 0 ? '+' : ''}
              {selectedCo.change.toFixed(2)}%)
            </span>
          </div>
          <div className="tooltip-rank">Rank #{rank}</div>
          
          {valueScore && (
            <div className="minimap-score-badge" style={{ 
              background: `${getScoreColor(valueScore.overall)}22`,
              border: `2px solid ${getScoreColor(valueScore.overall)}`,
              color: getScoreColor(valueScore.overall)
            }}>
              <div className="score-badge-number">{valueScore.overall}</div>
              <div className="score-badge-label">VALUE</div>
              {valueScore.dataCompleteness < 80 && (
                <div className="score-badge-completeness">{valueScore.dataCompleteness}% data</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


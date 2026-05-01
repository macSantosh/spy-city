'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useCityStore } from '@/store/cityStore';
import { calcDims } from '@/city/dimensions';
import { calcWorldPos } from '@/city/CityLayout';

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

export function SearchBar() {
  const companies = useCityStore((s) => s.companies);
  const setSelected = useCityStore((s) => s.setSelected);
  const setFlyTarget = useCityStore((s) => s.setFlyTarget);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pre-compute matched placement logic mapping exactly to `Buildings.tsx` rendering order
  const { sorted, positionMap } = useMemo(() => {
    const sorted = [...companies].sort((a, b) => b.marketCap - a.marketCap);
    const maxMcap = sorted[0]?.marketCap ?? 1;

    // Must precisely identical procedural layout generation internally correctly mapping components
    const shuffled = seededShuffle(companies, companies.length);
    const positionMap = new Map<string, { cx: number; cz: number; h: number; b: number }>();
    
    shuffled.forEach((co, idx) => {
      const { cx, cz } = calcWorldPos(idx);
      const { h, b } = calcDims(co.marketCap, maxMcap);
      positionMap.set(co.ticker, { cx, cz, h, b });
    });

    return { sorted, positionMap };
  }, [companies]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return sorted
      .filter((co) => co.ticker.toLowerCase().includes(q) || co.name.toLowerCase().includes(q))
      .slice(0, 9);
  }, [query, sorted]);

  const flyToCompany = useCallback(
    (ticker: string) => {
      const company = sorted.find((c) => c.ticker === ticker);
      const pos = positionMap.get(ticker);
      if (!company || !pos) return;

      setSelected(company);
      setFlyTarget({ cx: pos.cx, cz: pos.cz, b: pos.b, h: pos.h, source: 'search' });
      setQuery(ticker);
      setOpen(false);
    },
    [sorted, positionMap, setSelected, setFlyTarget]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && results.length > 0) {
      flyToCompany(results[0].ticker);
    }
    if (e.key === 'Escape') {
      inputRef.current?.blur();
      setOpen(false);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  return (
    <div ref={wrapRef} className="search-wrap">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => query && setOpen(true)}
        placeholder="⌕  Search ticker or company..."
        className="search-input"
        autoComplete="off"
      />

      {open && results.length > 0 && (
        <div className="search-dropdown">
          {results.map((co) => (
            <div
              key={co.ticker}
              className="search-item"
              onClick={() => flyToCompany(co.ticker)}
            >
              <span className="search-item-ticker">{co.ticker}</span>
              <span className="search-item-name">{co.name}</span>
              <span className={`search-item-change ${co.change >= 0 ? 'positive' : 'negative'}`}>
                {co.change >= 0 ? '+' : ''}{co.change.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

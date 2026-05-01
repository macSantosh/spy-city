'use client';

import { useMemo } from 'react';
import { mkTickerTex } from '@/textures/tickerTexture';
import * as THREE from 'three';

interface TickerLabelProps {
  ticker: string;
  price: number;
  change: number;
  height: number;
  base: number;
}

export function TickerLabel({ ticker, price, change, height, base }: TickerLabelProps) {
  const material = useMemo(() => {
    const tex = mkTickerTex(ticker, price, change);
    return new THREE.SpriteMaterial({ map: tex });
  }, [ticker, price, change]);

  return (
    <sprite
      position={[0, height + base * 0.7, 0]}
      scale={[base * 2.4, base * 0.85, 1]}
      material={material}
    />
  );
}

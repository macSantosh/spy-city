'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useCityStore } from '@/store/cityStore';
import { NeonSign } from './NeonSign';
import { TickerLabel } from './TickerLabel';
import { SelectionBeam } from './SelectionBeam';
import { mkWindowTex } from '@/textures/windowTexture';
import { SECTOR_COLORS } from '@/data/sectors';
import { theme } from '@/data/theme';
import type { Company, BuildingDims } from '@/data/types';

interface BuildingProps {
  company: Company;
  position: [number, number, number];
  dims: BuildingDims;
  rank: number;
}

export function Building({ company, position, dims, rank }: BuildingProps) {
  const { h, b } = dims;
  const setSelected = useCityStore((s) => s.setSelected);
  const setFlyTarget = useCityStore((s) => s.setFlyTarget);
  const selectedTicker = useCityStore((s) => s.selectedTicker);
  const isSelected = selectedTicker === company.ticker;

  const blinkRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const blinkPhase = useMemo(() => Math.random() * Math.PI * 2, []);

  const color = SECTOR_COLORS[company.sector] ?? theme.scene.building.fallback;
  const colorInt = parseInt(color.replace('#', ''), 16);

  // Window texture — memoized per building dimensions
  const windowMaterials = useMemo(() => {
    const wTex = mkWindowTex(b, h);
    
    // MeshBasicMaterial guarantees the texture is drawn correctly without any physics lighting multiplying it to black.
    const wMat = new THREE.MeshBasicMaterial({ map: wTex, color: theme.scene.building.window });
    const tMat = new THREE.MeshLambertMaterial({ color: theme.scene.building.base });
    
    // BoxGeometry face order: +x, -x, +y, -y, +z, -z
    return [wMat, wMat, tMat, tMat, wMat, wMat];
  }, [b, h]);

  const handleClick = (e: any) => {
    e.stopPropagation(); // Avoid clicking ground behind it
    setSelected(company);
    const [cx, , cz] = position;
    setFlyTarget({ cx, cz, b, h, source: 'click' });
  };

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Animate antenna blink
    if (blinkRef.current) {
      const on = Math.sin(t * 3 + blinkPhase) > 0.7;
      (blinkRef.current.material as THREE.MeshBasicMaterial).color.setHex(on ? theme.scene.building.neonOn : theme.scene.building.neonOff);
    }
    
    // Emissive selection pulse via Color lerping instead of Emissive map
    if (bodyRef.current) {
      // Lerp windows between natural white (100% texture) to half-tinted sector color
      const targetWindowColor = isSelected ? new THREE.Color(colorInt).lerp(new THREE.Color(theme.scene.building.window), 0.4) : new THREE.Color(theme.scene.building.window);

      const mats = bodyRef.current.material as any[];
      if (mats && mats[0] && mats[0].color) {
        mats[0].color.lerp(targetWindowColor, 0.1); 
      }
    }
  });

  const showAntenna = h > 60;
  const roofCapHeight = Math.max(0.6, h * 0.025);

  return (
    <group position={position}>
      {/* Main building body */}
      <mesh
        ref={bodyRef}
        position={[0, h / 2, 0]}
        onClick={handleClick}
        castShadow
        material={windowMaterials}
      >
        <boxGeometry args={[b, h, b]} />
      </mesh>

      {/* Roof cap */}
      <mesh position={[0, h + Math.max(0.3, h * 0.012), 0]}>
        <boxGeometry args={[b * 0.82, roofCapHeight, b * 0.82]} />
        <meshLambertMaterial color={theme.scene.building.roof} />
      </mesh>

      {/* Antenna for tall buildings */}
      {showAntenna && (
        <group position={[0, h + h * 0.03 + h * 0.03, 0]}>
          <mesh>
            <cylinderGeometry args={[0.15, 0.15, h * 0.06, 6]} />
            <meshBasicMaterial color={theme.scene.building.acUnit} />
          </mesh>
          {/* Blinking red light */}
          <mesh ref={blinkRef} position={[0, h * 0.04, 0]}>
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshBasicMaterial color={theme.scene.building.lightBeacon} />
          </mesh>
        </group>
      )}

      {/* Neon signs on all 4 faces */}
      <NeonSign label={company.name} color={color} height={h} base={b} />

      {/* Ticker/price sprite above rooftop */}
      <TickerLabel
        ticker={company.ticker}
        price={company.price}
        change={company.change}
        height={h}
        base={b}
      />

      {/* Sector-colored point light for major companies */}
      {company.marketCap > 350 && (
        <pointLight
          color={colorInt}
          intensity={0.45}
          distance={50}
          position={[0, h * 0.35, b / 2 + 3]}
        />
      )}

      {/* Selection Beam Overlay */}
      {isSelected && <SelectionBeam height={h} base={b} color={color} />}
    </group>
  );
}

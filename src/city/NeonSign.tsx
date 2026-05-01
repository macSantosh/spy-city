'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { mkNeonTex } from '@/textures/neonTexture';

interface NeonSignProps {
  label: string;
  color: string;
  height: number;
  base: number;
}

export function NeonSign({ label, color, height, base }: NeonSignProps) {
  const displayLabel = label.length > 11 ? label.substring(0, 11) : label;
  const tex = useMemo(() => mkNeonTex(displayLabel, color), [displayLabel, color]);

  const neonHeight = height * 0.3;
  const planeW = base * 0.88;
  const planeH = Math.min(height * 0.07, 3.5);
  const sidePlaneH = Math.min(height * 0.06, 3);
  const offset = base / 2 + 0.06;

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [tex],
  );

  return (
    <>
      {/* Front face */}
      <mesh position={[0, neonHeight, offset]} material={material}>
        <planeGeometry args={[planeW, planeH]} />
      </mesh>

      {/* Back face */}
      <mesh position={[0, neonHeight, -offset]} rotation={[0, Math.PI, 0]} material={material}>
        <planeGeometry args={[planeW, planeH]} />
      </mesh>

      {/* Right face */}
      <mesh position={[offset, neonHeight * 0.9, 0]} rotation={[0, Math.PI / 2, 0]} material={material}>
        <planeGeometry args={[planeW, sidePlaneH]} />
      </mesh>

      {/* Left face */}
      <mesh position={[-offset, neonHeight * 0.9, 0]} rotation={[0, -Math.PI / 2, 0]} material={material}>
        <planeGeometry args={[planeW, sidePlaneH]} />
      </mesh>
    </>
  );
}

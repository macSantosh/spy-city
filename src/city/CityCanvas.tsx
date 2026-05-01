'use client';

import { Canvas } from '@react-three/fiber';
import { CityScene } from './CityScene';
import { theme } from '@/data/theme';

export function CityCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 140, 235], fov: 55, near: 0.5, far: 2000 }}
      gl={{ antialias: true }}
      dpr={[1, 2]}
      shadows
      style={{ position: 'fixed', inset: 0 }}
    >
      <fog attach="fog" args={[theme.scene.fog, 200, 900]} />
      <CityScene />
    </Canvas>
  );
}

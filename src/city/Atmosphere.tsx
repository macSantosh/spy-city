'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { theme } from '@/data/theme';

export function Atmosphere() {
  const glowRef = useRef<THREE.PointLight>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Animate city glow pulse and ring opacity
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (glowRef.current) {
      glowRef.current.intensity = 1.8 + Math.sin(t * 0.7) * 0.5;
    }
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.12 + Math.sin(t * 0.5) * 0.05;
    }
  });

  return (
    <>
      {/* Ambient light — dark but not pitch black */}
      <ambientLight color={theme.scene.atmosphere.ambient} intensity={1.0} />

      {/* Directional moonlight */}
      <directionalLight color={theme.scene.atmosphere.directional} intensity={0.4} position={[100, 200, -100]} />

      {/* City center pulsing glow */}
      <pointLight ref={glowRef} color={theme.scene.atmosphere.glowCenter} intensity={1.8} distance={500} position={[0, 8, 0]} />

      {/* Star field — 5000 stars in hemisphere */}
      <Stars radius={900} depth={100} count={5000} factor={3} saturation={0} fade speed={0.5} />

      {/* Moon sphere */}
      <mesh position={[100, 200, -400]}>
        <sphereGeometry args={[18, 16, 16]} />
        <meshBasicMaterial color={theme.scene.atmosphere.star1} />
      </mesh>

      {/* Moon halo — inner */}
      <mesh position={[100, 200, -400]}>
        <sphereGeometry args={[22, 16, 16]} />
        <meshBasicMaterial color={theme.scene.atmosphere.star2} transparent opacity={0.15} depthWrite={false} />
      </mesh>

      {/* Moon halo — outer */}
      <mesh position={[100, 200, -400]}>
        <sphereGeometry args={[24, 16, 16]} />
        <meshBasicMaterial color={theme.scene.atmosphere.star3} transparent opacity={0.08} depthWrite={false} />
      </mesh>
    </>
  );
}

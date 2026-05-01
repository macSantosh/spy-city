import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

interface SelectionBeamProps {
  height: number;
  base: number;
  color: string;
}

export function SelectionBeam({ height, base, color }: SelectionBeamProps) {
  const cnRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  
  // Phase offset so multiple beams don't perfectly sync if ever required
  const phase = useMemo(() => Math.random() * Math.PI, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (cnRef.current) {
      const mat = cnRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.08 + Math.sin(t * 1.2 + phase) * 0.05;
    }
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.15 + Math.sin(t * 0.8) * 0.12;
      
      const scale = 1.0 + Math.sin(t * 0.6) * 0.04;
      ringRef.current.scale.set(scale, scale, 1);
    }
  });

  return (
    <group>
      {/* 1. Vertical cone beam */}
      <mesh
        ref={cnRef}
        position={[0, height + 150, 0]}
      >
        <cylinderGeometry args={[4, 0.5, 300, 16, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 2. Ground ring halo */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
      >
        <ringGeometry args={[base * 0.55, base * 0.75, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Roof point light (colors the surrounding buildings) */}
      <pointLight
        color={color}
        intensity={1.2}
        distance={height * 1.5}
        position={[0, height + 5, 0]}
      />
    </group>
  );
}

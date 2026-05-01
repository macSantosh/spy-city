'use client';

/**
 * BoulevardTraffic.tsx
 *
 * Renders animated glowing car traffic exclusively on boulevard roads.
 * Phase 1 — fixed density, neutral colour palette.
 * Phase 3 hook — connect useCityStore companies + calcWorldPos positions to
 *                computeTrafficMood() for per-segment density/tint reactivity.
 *
 * Rendering approach: single InstancedMesh (140 cars max) with per-instance
 * colour set via InstancedMesh.setColorAt().  All maths run in useFrame with
 * zero heap allocation — one shared Object3D dummy reused for matrix updates.
 */

import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getBoulevardAxes, BLVD_LANE_OFFSETS } from './CityLayout';

// ─── Car geometry constants ────────────────────────────────────────────────────
const CAR_W = 4.0;   // width  (perpendicular to travel)
const CAR_H = 3.0;   // height — taller so visible from aerial camera
const CAR_L = 8.0;   // length (along travel axis)
const CAR_Y = 3.5;   // explicit Y above road (road at y=0.06) — no half-height calc

// ─── Traffic density ──────────────────────────────────────────────────────────
const CARS_PER_LANE = 7;  // more cars per lane = denser, more visible streams

// ─── Speed (progress units per second, 1 = full boulevard length traversal) ───
const BASE_SPEED = 0.022;
const SPEED_VAR  = 0.008;

// ─── Colour palette ───────────────────────────────────────────────────────────
// Positive-direction lanes show headlights; negative show taillights from behind
const C_HEAD = new THREE.Color(0xfff4cc);  // warm white headlights
const C_TAIL = new THREE.Color(0xff2200);  // bright brake-red taillights

// ─── Internal car descriptor ──────────────────────────────────────────────────
interface Car {
  fixedAxis:  'x' | 'z';
  fixedCoord: number;    // world position of boulevard centre-line
  laneOffset: number;    // offset from centre-line (±4, ±10)
  direction:  1 | -1;   // +1 = positive run axis, -1 = negative
  progress:   number;    // 0–1 along the boulevard length
  speed:      number;    // progress units per second
  runStart:   number;
  runEnd:     number;
}

// Simple LCG for deterministic stagger (no import needed)
function makeLCG(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function BoulevardTraffic() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy   = useMemo(() => new THREE.Object3D(), []);

  // ── Build car descriptors once ────────────────────────────────────────────
  const { cars, totalCount } = useMemo(() => {
    const rand = makeLCG(777);
    const axes = getBoulevardAxes();
    const cars: Car[] = [];    for (const blvd of axes) {
      for (const lane of BLVD_LANE_OFFSETS) {
        for (let c = 0; c < CARS_PER_LANE; c++) {
          // Evenly stagger cars along the segment with a small random nudge
          const baseProgress = c / CARS_PER_LANE;
          cars.push({
            fixedAxis:  blvd.fixedAxis,
            fixedCoord: blvd.worldFixed,
            laneOffset: lane.offset,
            direction:  lane.direction,
            progress:   (baseProgress + rand() * (1 / CARS_PER_LANE - 0.02)) % 1,
            speed:      BASE_SPEED + (rand() - 0.5) * SPEED_VAR,
            runStart:   blvd.runStart,
            runEnd:     blvd.runEnd,
          });
        }
      }
    }

    return { cars, totalCount: cars.length };
  }, []); // static — recalculate only if layout constants change

  // ── Initialise per-instance colours after mount ─────────────────────────
  // Must run in useEffect (not useMemo) so meshRef.current exists.
  // Must run BEFORE the next WebGL frame so Three.js compiles the shader
  // WITH USE_INSTANCING_COLOR.  vertexColors must NOT be set on the material —
  // setColorAt writes to the instanceColor buffer, which is separate from
  // geometry vertex colors.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const col = new THREE.Color();
    cars.forEach((car, i) => {
      col.copy(car.direction === 1 ? C_HEAD : C_TAIL);
      mesh.setColorAt(i, col);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Animation loop ────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Cap delta to avoid huge jumps after a tab switch
    const dt = Math.min(delta, 0.05);

    cars.forEach((car, i) => {
      // Advance and loop
      car.progress += car.speed * dt;
      if (car.progress >= 1) car.progress -= 1;

      const span   = car.runEnd - car.runStart;
      const runPos = car.direction === 1
        ? car.runStart + car.progress * span
        : car.runEnd   - car.progress * span;

      // World position: one axis is fixed (boulevard centre + lane offset),
      // the other advances with progress.
      dummy.position.set(
        car.fixedAxis === 'x' ? car.fixedCoord + car.laneOffset : runPos,
        CAR_Y,
        car.fixedAxis === 'x' ? runPos : car.fixedCoord + car.laneOffset,
      );

      // Rotate to face direction of travel.
      // Car geometry: length along +Z by default (BoxGeometry).
      //   fixedAxis='x', dir=+1 → moving +Z → rotY = 0
      //   fixedAxis='x', dir=-1 → moving -Z → rotY = π
      //   fixedAxis='z', dir=+1 → moving +X → rotY = -π/2
      //   fixedAxis='z', dir=-1 → moving -X → rotY = +π/2
      dummy.rotation.set(
        0,
        car.fixedAxis === 'x'
          ? (car.direction === 1 ? 0 : Math.PI)
          : (car.direction === 1 ? -Math.PI / 2 : Math.PI / 2),
        0,
      );

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    /*
     * frustumCulled={false} is REQUIRED — the InstancedMesh object sits at
     * world origin with a zero bounding sphere, so Three.js would normally cull
     * the entire mesh before any instance is rendered.  Disabling frustum
     * culling lets all 196 car instances render regardless of the object origin.
     */
    <instancedMesh ref={meshRef} args={[undefined, undefined, totalCount]} frustumCulled={false}>
      <boxGeometry args={[CAR_W, CAR_H, CAR_L]} />
      {/*
       * DO NOT set vertexColors here.
       * vertexColors=true tells Three.js to read the geometry's 'color' attribute
       * (which BoxGeometry doesn't have) → all black.
       * Per-instance colours are driven by setColorAt() which populates the
       * separate instanceColor buffer.  The material color (white) acts as a
       * neutral multiplier: instanceColor × white = instanceColor.
       */}
      <meshBasicMaterial color={0xffffff} />
    </instancedMesh>
  );
}

'use client';

/**
 * StreetSigns.tsx
 *
 * Places one green canvas-texture street sign per major boulevard at its
 * nearest central intersection.  Sparse by design — only the "inner" 2 vertical
 * and 2 horizontal boulevards get signs to avoid cluttering edge roads.
 *
 * Sign orientation:
 *   Vertical boulevard signs (fixed x)  → face the Z axis (read by passing traffic)
 *   Horizontal boulevard signs (fixed z) → face the X axis
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { getBoulevardAxes } from './CityLayout';

// ─── Boulevard name lists (assigned by position order, left→right / top→bottom) ─
const VERT_NAMES  = ['Market Ave',   'Index Blvd',    'Tech Spine',     'Value Crossing'];
const HORIZ_NAMES = ['Earnings Way', 'Dividend Drive', 'Momentum Blvd'];

// ─── Sign geometry ─────────────────────────────────────────────────────────────
const POLE_H      = 7;
const SIGN_W      = 12;
const SIGN_H      = 2.8;
const SIGN_Y      = POLE_H + SIGN_H / 2 - 0.2;

// ─── Canvas texture factory ────────────────────────────────────────────────────
function makeSignTexture(name: string): THREE.CanvasTexture {
  const W = 320, H = 72;
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background — US-style green sign
  ctx.fillStyle = '#1a6b2a';
  ctx.fillRect(0, 0, W, H);

  // White border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, W - 8, H - 8);

  // Sign text
  ctx.fillStyle    = '#ffffff';
  ctx.font         = 'bold 26px "Arial Narrow", Arial, sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.toUpperCase(), W / 2, H / 2);

  return new THREE.CanvasTexture(canvas);
}

// ─── Single sign mesh ──────────────────────────────────────────────────────────
interface SignProps {
  x:       number;
  z:       number;
  name:    string;
  rotY:    number;   // radians — face direction of passing traffic
}

function StreetSign({ x, z, name, rotY }: SignProps) {
  const texture = useMemo(() => makeSignTexture(name), [name]);

  return (
    <group position={[x, 0, z]}>
      {/* Pole */}
      <mesh position={[0, POLE_H / 2, 0]}>
        <cylinderGeometry args={[0.12, 0.15, POLE_H, 7]} />
        <meshLambertMaterial color="#2a2f3a" />
      </mesh>

      {/* Sign board — double-sided so it reads from both travel directions */}
      <mesh position={[0, SIGN_Y, 0]} rotation={[0, rotY, 0]}>
        <planeGeometry args={[SIGN_W, SIGN_H]} />
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function StreetSigns() {
  const signDefs = useMemo(() => {
    const axes  = getBoulevardAxes();
    const vert  = axes.filter((a) => a.fixedAxis === 'x'); // vertical blvds
    const horiz = axes.filter((a) => a.fixedAxis === 'z'); // horizontal blvds

    // Use the innermost boulevard of the opposite axis as anchor for sign placement.
    // "Inner" = skip the outer edge (index 0) — inner starts at index 1.
    const anchorHorizZ = horiz[1]?.worldFixed ?? 0;  // anchor z for vertical signs
    const anchorVertX  = vert[1]?.worldFixed  ?? 0;  // anchor x for horizontal signs

    const defs: SignProps[] = [];

    // Vertical boulevard signs — skip edge (index 0 and last)
    const innerVert = vert.slice(1, vert.length - 1);
    innerVert.forEach((blvd, i) => {
      defs.push({
        x:    blvd.worldFixed + 15,   // offset to sidewalk edge of boulevard
        z:    anchorHorizZ   + 15,
        name: VERT_NAMES[i + 1] ?? `Blvd ${i + 1}`,
        rotY: 0,                       // face along Z axis (Z-running traffic reads it)
      });
    });

    // Horizontal boulevard signs — skip outer edge (index 0)
    const innerHoriz = horiz.slice(0, 2);
    innerHoriz.forEach((blvd, i) => {
      defs.push({
        x:    anchorVertX    - 15,    // offset to sidewalk edge on the other side
        z:    blvd.worldFixed - 15,
        name: HORIZ_NAMES[i] ?? `Ave ${i}`,
        rotY: Math.PI / 2,            // face along X axis
      });
    });

    return defs;
  }, []);

  return (
    <group>
      {signDefs.map((s) => (
        <StreetSign key={s.name} {...s} />
      ))}
    </group>
  );
}

'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { getCityBounds, getRoadGeometry, CITY_COLS, CITY_ROWS } from './CityLayout';
import { theme } from '@/data/theme';

export function Ground() {
  const { width, depth } = getCityBounds();
  
  // vertical roads (13 lines)
  const vRoads = useMemo(() => {
    const arr = [];
    for (let i = 0; i <= CITY_COLS; i++) {
        const geom = getRoadGeometry(i);
        arr.push({ x: geom.center - width / 2, width: geom.width, isBlvd: geom.isBlvd });
    }
    return arr;
  }, [width]);

  // horizontal roads (12 lines)
  const hRoads = useMemo(() => {
    const arr = [];
    for (let i = 0; i <= CITY_ROWS; i++) {
        const geom = getRoadGeometry(i);
        arr.push({ z: geom.center - depth / 2, width: geom.width, isBlvd: geom.isBlvd });
    }
    return arr;
  }, [depth]);

  const intersections = useMemo(() => {
    const ix = [];
    for (let c = 0; c <= CITY_COLS; c++) {
      for (let r = 0; r <= CITY_ROWS; r++) {
         const rx = getRoadGeometry(c).center - width / 2;
         const rz = getRoadGeometry(r).center - depth / 2;
         const isBlvdC = c % 4 === 0;
         const isBlvdR = r % 4 === 0;
         const isBlvd = isBlvdC || isBlvdR;
         
         const offsetC = isBlvdC ? 13 : 6;
         const offsetR = isBlvdR ? 13 : 6;
         
         ix.push({
             x: rx, z: rz,
             isBlvd,
             w: getRoadGeometry(c).width,
             d: getRoadGeometry(r).width,
             lamps: [
               { x: rx + offsetC + 1.5, z: rz + offsetR + 1.5 },
               { x: rx - offsetC - 1.5, z: rz - offsetR - 1.5 },
               { x: rx + offsetC + 1.5, z: rz - offsetR - 1.5 },
               { x: rx - offsetC - 1.5, z: rz + offsetR + 1.5 },
             ]
         });
      }
    }
    return ix;
  }, [width, depth]);

  const ringRadius = Math.max(width, depth) * 0.72;

  // Y offsets to eliminate Z-fighting natively
  const Y_GROUND = 0;
  const Y_ROAD = 0.06;
  const Y_SIDEWALK = 0.04;
  const Y_DIVIDER = 0.065;
  const Y_INTERSECTION = 0.07;

  return (
    <group>
      {/* Base Ground Plane (Dark Blocks) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width + 100, depth + 100]} />
        <meshLambertMaterial color={theme.scene.ground} />
      </mesh>

      {/* Outer Glow Perimeter */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[ringRadius, ringRadius * 1.08, 64]} />
        <meshBasicMaterial color={theme.scene.glowPerimeter} transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Vertical Road Strips */}
      {vRoads.map((road, i) => (
        <group key={`vr-${i}`} position={[road.x, 0, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, Y_ROAD, 0]}>
            <planeGeometry args={[road.width, depth + 100]} />
            <meshLambertMaterial color={road.isBlvd ? theme.scene.blvd : theme.scene.road} />
          </mesh>

          {/* Dividing lines */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, Y_DIVIDER, 0]}>
            <planeGeometry args={[road.isBlvd ? 0.6 : 0.4, depth + 100]} />
            <meshBasicMaterial color={theme.scene.line} transparent={!road.isBlvd} opacity={road.isBlvd ? 1 : 0.6} />
          </mesh>

          {road.isBlvd && (
            <>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8, Y_DIVIDER, 0]}>
                 <planeGeometry args={[0.4, depth + 100]} />
                 <meshBasicMaterial color={theme.scene.lineWhite} transparent opacity={0.5} />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8, Y_DIVIDER, 0]}>
                 <planeGeometry args={[0.4, depth + 100]} />
                 <meshBasicMaterial color={theme.scene.lineWhite} transparent opacity={0.5} />
              </mesh>
            </>
          )}

          {/* Raised Sidewalk Cuffs */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-road.width/2 - 1, Y_SIDEWALK, 0]}>
             <planeGeometry args={[2, depth + 100]} />
             <meshLambertMaterial color={theme.scene.sidewalk} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[road.width/2 + 1, Y_SIDEWALK, 0]}>
             <planeGeometry args={[2, depth + 100]} />
             <meshLambertMaterial color={theme.scene.sidewalk} />
          </mesh>
        </group>
      ))}

      {/* Horizontal Road Strips */}
      {hRoads.map((road, i) => (
        <group key={`hr-${i}`} position={[0, 0, road.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, Y_ROAD, 0]}>
            <planeGeometry args={[width + 100, road.width]} />
            <meshLambertMaterial color={road.isBlvd ? theme.scene.blvd : theme.scene.road} depthWrite={false} />
          </mesh>

          {/* Dividing lines */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, Y_DIVIDER, 0]}>
            <planeGeometry args={[width + 100, road.isBlvd ? 0.6 : 0.4]} />
            <meshBasicMaterial color={theme.scene.line} transparent={!road.isBlvd} opacity={road.isBlvd ? 1 : 0.6} />
          </mesh>

          {road.isBlvd && (
            <>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, Y_DIVIDER, -8]}>
                 <planeGeometry args={[width + 100, 0.4]} />
                 <meshBasicMaterial color={theme.scene.lineWhite} transparent opacity={0.5} />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, Y_DIVIDER, 8]}>
                 <planeGeometry args={[width + 100, 0.4]} />
                 <meshBasicMaterial color={theme.scene.lineWhite} transparent opacity={0.5} />
              </mesh>
            </>
          )}

          {/* Raised Sidewalk Cuffs */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, Y_SIDEWALK, -road.width/2 - 1]}>
             <planeGeometry args={[width + 100, 2]} />
             <meshLambertMaterial color={theme.scene.sidewalk} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, Y_SIDEWALK, road.width/2 + 1]}>
             <planeGeometry args={[width + 100, 2]} />
             <meshLambertMaterial color={theme.scene.sidewalk} />
          </mesh>
        </group>
      ))}

      {/* Intersections & Lamps */}
      {intersections.map((ix, i) => (
        <group key={`ix-${i}`} position={[ix.x, 0, ix.z]}>
          {/* Solid intersection pad overlapping the lines perfectly */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, Y_INTERSECTION, 0]}>
            <planeGeometry args={[ix.w, ix.d]} />
            <meshLambertMaterial color={ix.isBlvd ? theme.scene.blvd : theme.scene.road} />
          </mesh>

          {/* Central intersection lamp pool — boulevards get wider, warmer pool so traffic reads clearly */}
          <pointLight
            position={[0, 9, 0]}
            color={ix.isBlvd ? theme.scene.lampLightBlvd : theme.scene.lampLight}
            intensity={ix.isBlvd ? 1.6 : 0.5}
            distance={ix.isBlvd ? 60 : 32}
          />

          {/* Corner posts */}
          {ix.lamps.map((lamp, id) => (
            <mesh key={`post-${i}-${id}`} position={[lamp.x - ix.x, 4.5, lamp.z - ix.z]}>
              <cylinderGeometry args={[0.09, 0.15, 9, 6]} />
              <meshLambertMaterial color={theme.scene.lampPost} />
              {/* Hot glowing bulb tip */}
              <mesh position={[0, 4.6, 0]}>
                  <sphereGeometry args={[0.3, 8, 8]} />
                  <meshBasicMaterial color={theme.scene.lampBulb} />
              </mesh>
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

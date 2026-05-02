'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import CameraControlsImpl from 'camera-controls';
import * as THREE from 'three';
import { useCityStore } from '@/store/cityStore';

export function CameraController() {
  const controlsRef = useRef<CameraControlsImpl>(null);
  const tmpTargetRef = useRef(new THREE.Vector3());
  const flyTarget = useCityStore((s) => s.flyTarget);
  const selectedTicker = useCityStore((s) => s.selectedTicker);
  const setSelected = useCityStore((s) => s.setSelected);
  const minCameraY = 1.0;
  const maxCameraY = 120; // Limit camera height to 60% of typical max building heights (~200)
  const minTargetY = 0.0;

  // Default setup jump
  useEffect(() => {
    if (controlsRef.current) {
      // Set default position within the 60% height limit
      controlsRef.current.setLookAt(0, 100, 280, 0, 30, 0, false);
    }
  }, []);

  // Handle mathematically perfect building selection tracking (click or search)
  useEffect(() => {
    if (!controlsRef.current || !flyTarget) return;

    const { cx, cz, b, h, source } = flyTarget;
    
    // Core Building Focus Root target (Look at the 65% mark of the building)
    const tx = cx;
    const ty = h * 0.65;
    const tz = cz;

    // Calculate the camera's CURRENT angle relative to the building
    const camPos = controlsRef.current.camera.position;
    const dx = camPos.x - cx;
    const dz = camPos.z - cz;
    const currentAngle = Math.atan2(dz, dx);
    
    // The user requested flying to the "other side" (180 degrees mapping)
    const targetAngle = currentAngle + Math.PI;

    // Create a smooth cinematic 60-degree viewing flight path
    const radius = h * 0.9;
    const px = cx + Math.cos(targetAngle) * radius;
    const pz = cz + Math.sin(targetAngle) * radius;
    const py = h * 1.1 + 15; // guaranteed to be slightly above the building roof

    // Vector extraction to enforce explicit distance limits relative to building size
    const targetVec = new THREE.Vector3(tx, ty, tz);
    const posVec = new THREE.Vector3(px, py, pz);
    
    const dir = new THREE.Vector3().subVectors(posVec, targetVec).normalize();
    const desiredDistance = Math.max(45, source === 'search' ? h * 2.0 : h * 1.6);
    
    const finalPos = targetVec.clone().add(dir.multiplyScalar(desiredDistance));

    controlsRef.current.setLookAt(
      finalPos.x, finalPos.y, finalPos.z,
      tx, ty, tz,
      true // enableTransition native cubic interpolation
    );
  }, [flyTarget]);

  // Cinematic slow rotation while building is selected
  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (selectedTicker) {
      // Only auto-rotate if the camera is completely dormant (transition finished, user not dragging)
      const isResting = controls.currentAction === CameraControlsImpl.ACTION.NONE;
      if (isResting) {
        // Rotate the azimuth slowly. 0.05 rad/sec = ~2 minutes for a full 360 degree orbit.
        // This gives that cinematic "moving camera angle slowly" feel without inducing motion sickness.
        controls.rotate(delta * 0.05, 0, false);
      }
    }

    // Hard floor guard: prevent any camera/target state from slipping below ground.
    // Also enforce maximum height limit (60% of max building heights)
    const camPos = controls.camera.position;
    controls.getTarget(tmpTargetRef.current);

    const nextTargetY = Math.max(tmpTargetRef.current.y, minTargetY);
    const nextCameraY = Math.max(camPos.y, nextTargetY + minCameraY);
    const clampedCameraY = Math.min(nextCameraY, maxCameraY); // Enforce max height

    if (nextTargetY !== tmpTargetRef.current.y || clampedCameraY !== camPos.y) {
      controls.setLookAt(
        camPos.x,
        clampedCameraY,
        camPos.z,
        tmpTargetRef.current.x,
        nextTargetY,
        tmpTargetRef.current.z,
        false
      );
    }
  });

  // Handle constraints easing when selected
  // Limit vertical tilt to prevent top-down aerial views - keep camera at mid-level perspective
  const baseMinPolar = Math.PI * 0.35; // ~63 deg - prevents overhead/top-down view
  const baseMaxPolar = Math.PI * 0.6; // ~108 deg - prevents looking straight up
  const relaxedMaxPolar = Math.PI * 0.65; // ~117 deg - slightly more upward tilt when building selected
  
  // Universal ESC handler mapping directly into smooth Top-down aerial resets
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Never capture key strokes inside active UI forms
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'Escape') {
         setSelected(null);
         controlsRef.current?.setLookAt(0, 100, 280, 0, 30, 0, true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setSelected]);

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minDistance={25}
      maxDistance={480}
      minPolarAngle={baseMinPolar} // Prevent top-down overhead view - keep at mid-level
      maxPolarAngle={selectedTicker ? relaxedMaxPolar : baseMaxPolar} // Prevent looking straight up
      smoothTime={0.15} // Enforce natural mouse inertia 
      draggingSmoothTime={0.15}
      dollyToCursor={true}
      mouseButtons={{
        left: CameraControlsImpl.ACTION.ROTATE,
        middle: CameraControlsImpl.ACTION.DOLLY,
        right: CameraControlsImpl.ACTION.NONE, // Ban accidental map drift Panning
        wheel: CameraControlsImpl.ACTION.DOLLY,
      }}
    />
  );
}

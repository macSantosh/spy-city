'use client';

import { Buildings } from './Buildings';
import { Ground } from './Ground';
import { Atmosphere } from './Atmosphere';
import { CameraController } from './CameraController';

export function CityScene() {
  return (
    <>
      <Atmosphere />
      <Ground />
      <Buildings />
      <CameraController />
    </>
  );
}

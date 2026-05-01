'use client';

import { Buildings } from './Buildings';
import { Ground } from './Ground';
import { Atmosphere } from './Atmosphere';
import { CameraController } from './CameraController';
import { BoulevardTraffic } from './BoulevardTraffic';
import { StreetSigns } from './StreetSigns';

export function CityScene() {
  return (
    <>
      <Atmosphere />
      <Ground />
      <BoulevardTraffic />
      <StreetSigns />
      <Buildings />
      <CameraController />
    </>
  );
}

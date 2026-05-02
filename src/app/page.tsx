'use client';

import { CityCanvas } from '@/city/CityCanvas';
import { HUD } from '@/components/HUD/HUD';
import { SearchBar } from '@/components/SearchBar/SearchBar';
import { InfoPanel } from '@/components/InfoPanel/InfoPanel';
import { Minimap } from '@/components/Minimap/Minimap';
import { LoadingScreen } from '@/components/LoadingScreen/LoadingScreen';
import { useCompanyData } from '@/hooks/useCompanyData';

export default function Home() {
  const { loading } = useCompanyData();

  return (
    <>
      {loading && <LoadingScreen />}
      <CityCanvas />
      <HUD />
      <SearchBar />
      <InfoPanel />
      <Minimap />
    </>
  );
}

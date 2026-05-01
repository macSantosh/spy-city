import { create } from 'zustand';
import type { Company } from '@/data/types';

export type CityMode = 'normal' | 'heatmap' | 'crash';

interface FlyTarget {
  cx: number;
  cz: number;
  b: number;
  h: number;
  source: 'click' | 'search';
}

interface CityState {
  // Selected company (shown in InfoPanel)
  selectedCompany: Company | null;
  selectedTicker: string | null;
  setSelected: (company: Company | null) => void;

  // Fly-to target (consumed by CameraController)
  flyTarget: FlyTarget | null;
  setFlyTarget: (target: FlyTarget | null) => void;

  // Sector visibility filters
  sectorFilters: Set<string>;
  toggleSector: (sector: string) => void;

  // City rendering mode
  cityMode: CityMode;
  setCityMode: (mode: CityMode) => void;

  // Company data
  companies: Company[];
  setCompanies: (companies: Company[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useCityStore = create<CityState>((set) => ({
  selectedCompany: null,
  selectedTicker: null,
  setSelected: (company) => set({ selectedCompany: company, selectedTicker: company ? company.ticker : null }),

  flyTarget: null,
  setFlyTarget: (target) => set({ flyTarget: target }),

  sectorFilters: new Set(),
  toggleSector: (sector) =>
    set((s) => {
      const next = new Set(s.sectorFilters);
      if (next.has(sector)) {
        next.delete(sector);
      } else {
        next.add(sector);
      }
      return { sectorFilters: next };
    }),

  cityMode: 'normal',
  setCityMode: (mode) => set({ cityMode: mode }),

  companies: [],
  setCompanies: (companies) => set({ companies }),
  loading: true,
  setLoading: (loading) => set({ loading }),
}));

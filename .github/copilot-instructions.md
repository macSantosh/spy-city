# Spy City — Technical Reference

**3D visualization of S&P 500 as a navigable night-time city.** Building dimensions derived from market cap.

**Stack:** Next.js 14 + React Three Fiber + TypeScript + Zustand + Finnhub API  
**Reference:** https://github.com/srizzon/git-city (city-grid layout, camera behavior)

**Golden rule:** React/Next.js owns DOM. R3F owns canvas. Communicate only through Zustand store — never directly.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx, layout.tsx
│   └── api/quotes/route.ts      # Finnhub proxy (server-side only)
├── city/                         # R3F/Three.js (no React UI)
│   ├── CityCanvas.tsx, CityScene.tsx, Buildings.tsx, Building.tsx
│   ├── Ground.tsx, Atmosphere.tsx, CameraController.tsx
│   ├── CityLayout.ts             # Block/slot position math
│   └── dimensions.ts             # calcDims(mcap, maxMcap) → {h, b}
├── textures/                     # Canvas texture factories (pure functions)
│   ├── windowTexture.ts, neonTexture.ts, tickerTexture.ts
├── components/                   # DOM UI (no Three.js)
│   ├── SearchBar/, InfoPanel/, HUD/, Minimap/
├── hooks/
│   └── useCompanyData.ts         # Orchestrates JSON + Finnhub + cache
├── store/
│   └── cityStore.ts              # Zustand: selectedCompany, flyTarget, mode
└── data/
    ├── types.ts, constituents.json, sectors.ts
```

---

## Data Schema

```ts
interface Company {
  ticker:   string;   // 'AAPL'
  name:     string;   // 'Apple Inc.'
  marketCap: number;  // billions USD
  price:    number;   // USD per share
  change:   number;   // daily % change, signed
  sector:   string;   // normalized key matching SECTOR_COLORS
  beta?, shares?, week52High?, week52Low?, exchange?: number | string;
}
```

GICS sector normalization in `sectors.ts`: `'Information Technology' → 'Technology'`, `'Financials' → 'Finance'`, etc.

---

## City Layout & Building Math

**Block-based grid (git-city style):** Buildings grouped into city blocks, roads between blocks.

**Dimension constants:**
- `SLOT` = 24, `BLOCK` = 48, `STREET` = 12, `BLVD` = 26, `MAX_BASE` = 20

**Block structure:** 2×2 slots = 4 buildings per block. Slot positions: `(-12,-12)`, `(12,-12)`, `(-12,12)`, `(12,12)`

**Superblock:** 4×4 blocks (16 blocks, 64 buildings). Width = 228 units, pitch (+ boulevard) = 254 units.

**Total:** 503 companies ÷ 4 = 126 blocks. City grid = 3×3 superblocks ≈ 762×762 world units.

**Building dimensions:**
- Height: `max(8, log(mcap) / log(maxMcap) × 185)` — log scale, Apple ≈185
- Base: `min(MAX_BASE, max(5, √(mcap / maxMcap) × 22 + 4))` — clamped to 20

**World position formula:**
```js
superCol = floor(blockCol / 4), superRow = floor(blockRow / 4)
blockX = superCol × 254 + (blockCol % 4) × (BLOCK + STREET)
blockZ = superRow × 254 + (blockRow % 4) × (BLOCK + STREET)
```

---

## API Integration

**Data sources:**
- S&P 500 list: `constituents.json` (static, Datahub.io CSV → JSON quarterly)
- Live quotes: Finnhub `/quote` (batch-fetched, 60/min free tier)
- Metrics: Finnhub `/stock/metric` (on-demand, building click)

**Rate limiting:** Batch in chunks of 55 tickers, 1,100ms between chunks.

**Caching:**
- Server: `unstable_cache`, 24h revalidate
- Client: `localStorage`, key `spy-city_v2`, 24h TTL
- Fallback chain: server cache → localStorage → `constituents.json`

**Environment:**
```
FINNHUB_API_KEY=your_key    # .env.local (server-side only)
```

---

## InfoPanel Fields

| Field | Source | Notes |
|---|---|---|
| Ticker, Name, Sector | `constituents.json` static import | Always present, no API needed |
| Price, Daily change | Finnhub quote | Batch-fetched |
| Market cap, Rank | Derived | marketCap field + sort index |
| Beta | Finnhub metric? | On-demand |
| Shares outstanding | Finnhub metric? | On-demand, ÷1000 for billions |
| 52-week high/low | Finnhub metric? | On-demand |

---

## Camera Controller

**Library:** Uses `@react-three/drei` `<CameraControls>` (wraps `yomotsu/camera-controls`). Provides programmatic `setLookAt()` transitions.

**Navigation Constraints:**
- `minPolarAngle` = `0.05` rad, `maxPolarAngle` = `Math.PI * 0.44` (~79°; relaxes to 85° when building selected)
- `minDistance` = `25`, `maxDistance` = `700`
- `dollyToCursor` = `true`, pan disabled

**Positions:**
- Default: Camera `[0, 200, 280]` → Target `[0, 30, 0]`
- Building fly-to: Camera `[cx + b*1.2, h*2.2, cz + b*1.8]` → Target `[cx, h*0.65, cz]`

---

## Building Selection

**Selection beam components:**
1. Vertical cone: `CylinderGeometry`, additive blending, sector color, opacity pulses `0.08–0.18`
2. Ground ring: `RingGeometry(b*0.55, b*0.75)`, opacity pulses `0.15–0.4`
3. Roof point light: sector color, intensity `1.2`
4. Building emissive: `emissiveIntensity` lerp 0–0.25 via `useFrame`

**State:** `cityStore.selectedTicker` holds ticker. Component: `src/city/SelectionBeam.tsx`

---

## Coding Rules

**Architecture:**
- R3F declarative JSX only in `src/city/` — never `new THREE.Mesh()` inside React components
- DOM UI only in `src/components/` — never Three.js imports there
- `src/city/` and `src/components/` communicate **only** through Zustand store
- `'use client'` required on any file using R3F hooks, `useFrame`, Zustand, or browser APIs

**R3F specifics:**
- `useFrame` for all animation — never `requestAnimationFrame` manually
- `useMemo` for all canvas textures — never create inside `useFrame` or render
- No `setState` / Zustand writes inside `useFrame` — causes render loops
- Fly-to easing: `t < 0.5 ? 4t³ : 1 - (-2t+2)³/2`

**TypeScript:**
- No `any`. All financial math functions fully typed
- Sector lookups null-safe: `SECTOR_COLORS[sector] ?? '#8899aa'`

**API & security:**
- API keys server-side only — route handlers exclusively. Never in client components
- Always proxy through internal `/api/` routes — never call Finnhub from the browser
- Fallback chain must always be implemented: server cache → localStorage → `constituents.json`

**Performance:**
- `InstancedMesh` required when N > 100 buildings
- `<Canvas dpr={[1, 2]}>` — never unbounded pixel ratio
- No Three.js object creation inside `useFrame`

---

## Contributor Quick-Start

```bash
git clone https://github.com/YOUR_USERNAME/spy-city
cd spy-city && npm install
cp .env.example .env.local   # add Finnhub key (optional)
npm run dev                  # http://localhost:3000
```

Orient yourself: `dimensions.ts` for building math, `cityStore.ts` for all state, `useCompanyData.ts` for data pipeline. 3D scene and UI communicate only through the store.
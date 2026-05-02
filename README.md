# Spy City 🌃

> **"If the stock market were a city, what would it look like at night?"**

Spy City renders every S&P 500 company as a building in a procedurally generated 3D night-time metropolis. Building height and footprint are derived from market capitalization — Apple and Microsoft tower as skyscrapers, smaller companies form the low-rise districts. Navigate the financial skyline, search for companies, and explore live market data in an immersive 3D environment.

**Live Demo:** [https://spy-city.vercel.app/](https://spy-city.vercel.app/)

**Portfolio Project** • **Open Source** • **Financial Education**

![Spy City Night Skyline](public/spy-city.png)

---

## ✨ Features

### Current
- 🏙️ **500+ buildings** — Every S&P 500 company rendered in 3D
- 🌃 **Night-time aesthetic** — Deep blacks, neon signs, street lamps, and moonlit fog
- 📊 **Live market data** — Real-time prices, market cap, daily changes from Finnhub
- 🎯 **Click-to-select** — Fly to any building, view detailed company metrics
- 🔍 **Live search** — Filter by ticker or company name, instant fly-to navigation
- 🗺️ **Minimap** — Orthographic top-down view with selected building indicator
- 🎨 **Sector colors** — Color-coded by GICS sector (Technology, Finance, Healthcare, etc.)
- 🚗 **Street-level detail** — Roads, boulevards, sidewalks, street lamps, intersections
- 🎮 **Smooth camera** — Orbit, zoom, fly-to animations with easing
- 💾 **Offline-ready** — Static constituent data fallback, works without API keys
- 🎭 **Selection beam** — Vertical light cone highlights selected buildings
- 📱 **Responsive UI** — HUD, search bar, info panel, sector legend

### In Progress
- 🔄 Background batch data refresh (chunked API calls to respect rate limits)
- 📏 Block-based city layout (git-city inspired grid system)
- ⚡ InstancedMesh performance optimization for 500+ buildings
- 📈 Progressive building updates (animate height/width as live data loads)

### Planned (Stages 4–5)
- ✨ Bloom post-processing for neon glow
- 🌧️ Rain particles + wet road reflections
- 🕒 Time machine (historical price data, animate building resize)
- 💥 Market crash mode (2008/2020 collapse animations)
- 📊 Heatmap mode (color by daily change magnitude)
- 🏢 Portfolio mode (highlight your holdings)
- 🥽 WebXR / Meta Quest support

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 14 App Router | Server-side API proxy, SSR, Vercel deployment |
| **3D Engine** | React Three Fiber + drei | Declarative Three.js, OrbitControls, Stars, Html |
| **Language** | TypeScript | Type-safe financial math and company data |
| **UI** | Tailwind CSS v4 | HUD, search, info panel styling |
| **State** | Zustand | Bridge between R3F scene and DOM UI |
| **Data** | Finnhub API (live) + Static JSON (fallback) | Market data, quotes, metrics |
| **Deployment** | Vercel | Zero-config, env vars, free tier |

**The golden rule:** React/Next.js owns the DOM. R3F owns the canvas. They communicate **only** through Zustand — never directly.

**Inspired by:** [git-city](https://github.com/srizzon/git-city) — Same stack (Next.js + R3F), city-grid layout, fly-to navigation, night aesthetic

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/spy-city
cd spy-city

# Install dependencies
npm install

# Configure environment variables (optional — fallback data works without API keys)
cp .env.example .env.local
# Edit .env.local and add your Finnhub API key (free tier: https://finnhub.io)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

**Required for live data:**
```bash
FINNHUB_API_KEY=your_key_here   # Get free key at https://finnhub.io
```

**How it works:**
- Without API key → City renders with static constituent data (ticker, name, sector)
- With API key → Live prices, market cap, daily changes, company metrics

**API key is server-side only** — all Finnhub calls are proxied through `/api/quotes/route.ts`. Your key is never exposed to the browser.

---

## 🎮 Navigation & Controls

### Mouse
- **Left-click + drag** — Orbit camera around city
- **Scroll** — Zoom in/out (zoom-to-cursor enabled)
- **Click building** — Select, fly-to, show info panel
- **Click ground** — Deselect, return to aerial view

### Keyboard
- **ESC** — Reset to default aerial view, deselect building
- **WASD** — Free-flight mode (disabled during building selection)
- **Q/E** — Ascend/descend in free-flight

### UI
- **Search bar** — Type ticker or company name, select result to fly to building
- **Sector legend** — Shows color-coded sector list (filter mode planned)
- **Info panel** — Company details when building selected
- **Minimap** — Top-down 2D overview with selected building indicator

---

## 📁 Project Structure

```
spy-city/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Root page component
│   │   ├── layout.tsx               # App layout
│   │   └── api/
│   │       └── quotes/route.ts      # Finnhub proxy (server-side only)
│   ├── city/                        # All R3F/Three.js — no React UI
│   │   ├── CityCanvas.tsx           # <Canvas> root, fog, dpr
│   │   ├── CityScene.tsx            # Composes Buildings, Ground, Atmosphere
│   │   ├── Building.tsx             # One company: mesh + neon + ticker
│   │   ├── Buildings.tsx            # Maps Company[] → <Building> instances
│   │   ├── Ground.tsx               # Roads, boulevards, sidewalks, lamps
│   │   ├── CityLayout.ts            # Block/slot grid position math
│   │   ├── Atmosphere.tsx           # Stars, moon, fog, glow
│   │   ├── CameraController.tsx     # OrbitControls + fly-to logic
│   │   ├── SelectionBeam.tsx        # Vertical light cone on selection
│   │   └── dimensions.ts            # calcDims(mcap) → {h, b} — pure math
│   ├── components/                  # DOM-only React UI — no Three.js
│   │   ├── SearchBar/               # Live-filter dropdown
│   │   ├── InfoPanel/               # Company detail card
│   │   ├── SectorLegend/            # Color-coded sector list
│   │   ├── HUD/                     # Title, stats, nav hints
│   │   └── Minimap/                 # 2D canvas top-down view
│   ├── textures/                    # Canvas texture factories (pure functions)
│   │   ├── windowTexture.ts         # Randomized lit/unlit windows
│   │   ├── neonTexture.ts           # Glowing company name sign
│   │   └── tickerTexture.ts         # TICKER · $PRICE · ±CHG% badge
│   ├── hooks/
│   │   └── useCompanyData.ts        # Orchestrates static JSON + Finnhub batch fetch + cache
│   ├── store/
│   │   └── cityStore.ts             # Zustand: selectedCompany, flyTarget, sectorFilters
│   └── data/
│       ├── types.ts                 # Company, BuildingDims interfaces
│       ├── constituents.json        # Static S&P 500 list (quarterly refresh)
│       ├── companies.ts             # FALLBACK_COMPANIES (top 50 subset)
│       └── sectors.ts               # SECTOR_COLORS + GICS normalization
└── _prototype/
    └── index.html                   # Original HTML prototype (reference only)
```

**Architecture principle:** R3F scene (`src/city/`) and DOM UI (`src/components/`) communicate **only** through the Zustand store. No direct imports between the two.

---

## 📦 Available Scripts

```bash
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Build for production
npm run start     # Run production build locally
npm run lint      # Run ESLint (if configured)
```

---

## 📊 Data Pipeline

### S&P 500 Constituent List
**Source:** [Datahub.io S&P 500 Dataset](https://datahub.io/core/s-and-p-500-companies)  
**Format:** CSV → JSON (converted via `scripts/csv-to-json.js`)  
**Fields:** Ticker, Company Name, GICS Sector  
**Refresh:** Quarterly (S&P 500 rebalances ~4× per year)

```bash
# To update constituents after S&P rebalancing:
node scripts/csv-to-json.js
# Converts src/util/constituents.csv → src/data/constituents.json
```

### Live Market Data
**Source:** [Finnhub API](https://finnhub.io) (free tier: 60 calls/min)  
**Endpoints:**
- `/quote` — Price, market cap, daily % change
- `/stock/metric` — Beta, 52-week high/low, shares outstanding
- `/stock/profile2` — Company name, exchange, industry

**Rate limit strategy:**  
503 companies ÷ 60 calls/min = ~9 minutes if sequential. Solution: **Batch in chunks of 55 tickers with 1,100ms between chunks**. Buildings update progressively as each chunk resolves.

**Caching (two layers):**
1. **Server cache** (`unstable_cache`) — 24h TTL, shared across all visitors
2. **Client cache** (`localStorage`) — 24h TTL, serves stale data instantly on repeat visits

**Fallback chain:** Server cache → localStorage → static `constituents.json` — City never renders blank.

---

## 🎨 Visual Theme — Night Owl

Spy City uses a **Night Owl** dark theme — every visual decision reinforces the feeling of a city seen from above at 2am.

### Color Palette
| Element | Color | Hex |
|---|---|---|
| Sky / Background | Deep navy | `#000814` |
| Ground / Asphalt | Near-black | `#030810` |
| Streets (2-way) | Dark asphalt | `#0a0f1a` |
| Boulevards (4-lane) | Lighter asphalt | `#0d1420` |
| Sidewalks | Muted gray | `#1a2030` |
| Window lights | Warm amber / Blue-white | `#ffe080` / `#a8d8ff` |
| Street lamps | Sodium yellow | `#ffffaa` |
| Moon | Cool white | `#ddeeff` |
| Fog | Exponential fog | `#000814` density 0.0022 |

### Sector Colors
```ts
Technology:  #00d4ff  // Cyan
Finance:     #ffd700  // Gold
Healthcare:  #ff4757  // Red
Consumer:    #ff6348  // Orange
Industrial:  #a29bfe  // Purple
Energy:      #00b894  // Green
Materials:   #fdcb6e  // Yellow
Real Estate: #6c5ce7  // Violet
Utilities:   #74b9ff  // Light blue
```

### Lighting
- **Directional moonlight** — Upper-right, `#4466aa`, intensity 0.4
- **Ambient light** — `#102040`, intensity 1.0
- **City-centre pulse** — Slow sin-wave point light, `#0033aa`
- **Street lamps** — Point lights at every intersection, `#ffffaa`, radius 24 units
- **Selection beam** — Vertical cone + ground ring, sector color, additive blending

---

## 🏗️ City Layout — Block-Based Grid

Inspired by git-city's city-grid system. Buildings are grouped into **city blocks** with roads defining the grid.

### Hierarchy
```
SLOT       — Space for 1 building (24×24 units)
BLOCK      — 2×2 slots = 4 buildings per block (48×48 units)
STREET     — 2-way road between blocks (12 units wide)
BOULEVARD  — 4-lane road every 4 blocks (26 units wide)
SUPERBLOCK — 4×4 blocks bounded by boulevards (254×254 units)
```

### Total City Footprint
- **503 companies** ÷ 4 per block = **126 blocks**
- Grid: **12 columns × 11 rows** = 132 block slots (6 empty)
- City size: **3 superblocks × 3 superblocks** = ~762×762 world units

### Building Dimensions (from market cap)
```ts
height = max(8, log(mcap) / log(maxMcap) × 185)  // Apple ≈185, smallest ≈20
base   = min(20, max(5, √(mcap / maxMcap) × 22 + 4))  // Clamped to fit slot
```

**Design choice:** Volume is intentionally not linear to market cap — cinematic over mathematical purity.

---

## 🚧 Project Status

### ✅ Stage 1–2: HTML Prototype → Next.js Migration (Complete)
- Three.js scene with fog, stars, moon, lighting, glow pulse
- 50-company city prototype with window textures, neon signs, ticker labels
- Road grid with visible asphalt, lane markings, street lamps
- Navigation: orbit, zoom, WASD flight, ESC reset, click-to-select, fly-to
- Zustand store, all DOM overlays (SearchBar, InfoPanel, HUD, SectorLegend, Minimap)
- Next.js API route scaffolding, Vercel deployment ready

### 🔄 Stage 3: Live Data Integration (In Progress)
- [x] `constituents.json` static import (503 companies)
- [x] `scripts/csv-to-json.js` conversion script
- [x] GICS sector normalization map
- [x] Finnhub quote + metrics route (`/api/quotes/route.ts`)
- [x] `useCompanyData` hook with two-layer caching
- [ ] Background batch fetch (chunks of 55 tickers, 1,100ms between chunks)
- [ ] Progressive building update as chunks resolve (animate height/width change)
- [ ] Migrate city layout to block-based grid (SLOT=24, BLOCK=48, STREET=12, BLVD=26)
- [ ] Implement `CityLayout.ts` — `calcBlockPos(blockCol, blockRow, slot)` helper
- [ ] Rebuild `Ground.tsx` with street/boulevard two-tier road planes
- [ ] Extend city render from 50 → 503 companies (126 blocks, 3×3 superblocks)
- [ ] `InstancedMesh` migration for 500+ building performance
- [ ] InfoPanel on-demand `/stock/metric` + `/stock/profile2` fetch

### 🔲 Stage 4: Visual Enhancements (Planned)
- UnrealBloomPass for neon glow
- Animated window shader (per-window flicker)
- Rain particles + wet road reflections
- Sector district zones with named overlays
- Day/night toggle
- Historical price data integration

### 🔲 Stage 5: UX Polish (Planned)
- Sector filter panel (buildings sink when hidden)
- Heatmap mode (color = daily change magnitude)
- Market history time machine (date slider → animate resize)
- Market Crash Mode (2008/2020 collapse + rebuild animation)
- Portfolio mode (highlight user holdings)
- WebXR / Meta Quest support
- Mobile touch joystick

---

## 🤝 Contributing

Contributions are welcome! Whether you're fixing bugs, adding features, or improving documentation — all help is appreciated.

### Development Guidelines

1. **Architecture rules:**
   - R3F declarative JSX only in `src/city/` — never `new THREE.Mesh()` inside React components
   - DOM UI only in `src/components/` — never Three.js imports there
   - `src/city/` and `src/components/` communicate **only** through Zustand store
   - `'use client'` required on any file using R3F hooks, `useFrame`, Zustand, or browser APIs

2. **Performance:**
   - `useFrame` for all animation — never `requestAnimationFrame` manually
   - `useMemo` for all canvas textures — never create inside `useFrame` or render
   - No `setState` / Zustand writes inside `useFrame` — causes render loops
   - `InstancedMesh` required when N > 100 buildings

3. **TypeScript:**
   - No `any` — all financial math functions fully typed
   - Sector lookups null-safe: `SECTOR_COLORS[sector] ?? '#8899aa'`

4. **API & Security:**
   - API keys server-side only — route handlers exclusively
   - Always proxy through internal `/api/` routes — never call Finnhub from browser
   - Fallback chain must always work: server cache → localStorage → `FALLBACK_COMPANIES`

### Contributor Quick-Start

```bash
git clone https://github.com/YOUR_USERNAME/spy-city
cd spy-city && npm install
cp .env.example .env.local   # Add Finnhub key (optional)
npm run dev                  # http://localhost:3000
```

**Orient yourself:**
- Read [`dimensions.ts`](src/city/dimensions.ts) for building math
- Read [`cityStore.ts`](src/store/cityStore.ts) for all state
- Read [`useCompanyData.ts`](src/hooks/useCompanyData.ts) for data pipeline

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed workflow and expectations.

---

## 🔒 Security

- **Never commit real API keys** — Real secrets belong in `.env.local` or `env.local.sh`
- **Only `.env.example` should be committed** — Template with placeholder values only
- **Report security issues privately** — See [SECURITY.md](SECURITY.md)

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

You are free to use, modify, and distribute this project. Attribution appreciated but not required.

---

## 🙏 Acknowledgments

- **[git-city](https://github.com/srizzon/git-city)** — Inspiration for the block-based city layout, fly-to camera system, and night aesthetic
- **[Datahub.io](https://datahub.io/core/s-and-p-500-companies)** — S&P 500 constituent data (freely available CSV)
- **[Finnhub](https://finnhub.io)** — Live stock market data API (generous free tier)
- **[React Three Fiber](https://github.com/pmndrs/react-three-fiber)** — Declarative Three.js in React
- **[@react-three/drei](https://github.com/pmndrs/drei)** — Essential R3F helpers (OrbitControls, Stars, Html, etc.)
- **[Zustand](https://github.com/pmndrs/zustand)** — Simple, elegant state management

---

## ⚠️ Disclaimer

**This project is for visualization and educational purposes only.**

- Not investment advice
- Not affiliated with S&P Dow Jones Indices LLC
- Market data accuracy depends on third-party APIs
- Past performance does not indicate future results

**Use at your own risk. Consult a licensed financial advisor for investment decisions.**

---

## 📸 Screenshots

[Coming Soon — City overview, building detail, search UI, minimap, selection beam]

---

## 🗺️ Roadmap

- [ ] Complete Stage 3 (live data integration, 503-company city)
- [ ] InstancedMesh performance optimization
- [ ] UnrealBloomPass for neon glow (Stage 4)
- [ ] Market Crash Mode (Stage 5)
- [ ] Time machine (historical price animation)
- [ ] Portfolio mode (track your holdings)
- [ ] WebXR support
- [ ] Mobile optimization

---

<div align="center">

**Built with ❤️ by [Your Name]**

[Live Demo](#) • [Report Bug](https://github.com/YOUR_USERNAME/spy-city/issues) • [Request Feature](https://github.com/YOUR_USERNAME/spy-city/issues)

**Star ⭐ this repo if you find it useful!**

</div>

# copilot-instructions.md — Spy City

> **Updated:** 2026-03 · Constituent list: static JSON from Datahub.io (quarterly refresh) · Live data: Finnhub only · FMP: not used
> **Status:** Stages 1–3 complete · Stage 3 live data integration in progress · Stages 4–5 pending
> **Prototype:** `_prototype/spy-city.html` (reference only)
> **Production:** Next.js project at repo root `spy-city/`

---

## 1. What This Project Is

**Spy City** renders every S&P 500 company as a building in a procedurally generated 3D night-time city. Building height and footprint are derived from market capitalization. The result is a navigable financial skyline — Apple and Microsoft are skyscrapers, smaller companies are low-rises.

**Goals:** Portfolio showcase · Open source (contributor-friendly structure) · Financial education

**Core metaphor:** "If the stock market were a city, what would it look like at night?"

**Reference project:** https://github.com/srizzon/git-city — Next.js + React Three Fiber, same stack. We replicate its city-grid layout, fly-to navigation, and night aesthetic, and extend it with financial data.

---

## 2. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 App Router | API routes proxy stock API keys server-side; aligns with git-city |
| 3D | React Three Fiber + `@react-three/drei` | Declarative Three.js; drei ships OrbitControls, Stars, Html out of the box |
| Language | TypeScript | Type safety on financial math and company interfaces |
| UI | Tailwind CSS | HUD, search bar, info panel — no separate CSS files |
| State | Zustand | Bridges R3F scene and DOM UI without prop-drilling |
| Deployment | Vercel | Zero-config Next.js, env vars for API keys, free tier |

**The golden rule:** React/Next.js owns the DOM. R3F owns the canvas. They communicate only through the Zustand store and R3F event callbacks — never directly.

---

## 3. Project Structure

```
spy-city/
├── scripts/
│   └── csv-to-json.js            # Converts downloaded constituents.csv → constituents.json
│                                 # Run quarterly after S&P 500 rebalancing
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── api/
│   │       └── quotes/route.ts   # Finnhub proxy — price, metrics, profile (server-side only)
│   ├── city/                     # All R3F/Three.js — no React UI in here
│   ├── CityCanvas.tsx            # <Canvas> root, fog, dpr
│   ├── CityScene.tsx             # Composes Buildings, Ground, Atmosphere, Camera
│   ├── Building.tsx              # One company: mesh + roof + neon signs + ticker label
│   ├── Buildings.tsx             # Maps Company[] → <Building> instances
│   ├── Ground.tsx                # Ground plane, streets + boulevards, sidewalk strips, street lamps
│   ├── CityLayout.ts             # Block/slot world-position math — calcBlockPos(blockCol, blockRow, slot)
│   ├── Atmosphere.tsx            # Stars, moon, fog, glow pulse
│   ├── CameraController.tsx      # OrbitControls + fly-to useFrame logic
│   └── dimensions.ts             # calcDims(mcap, maxMcap) → {h, b} — pure math, no React
├── textures/                     # Canvas texture factories — pure functions, no React
│   ├── windowTexture.ts          # Randomised lit/unlit apartment windows
│   ├── neonTexture.ts            # Glowing company name sign
│   └── tickerTexture.ts          # TICKER · $PRICE · ±CHG% badge
├── components/                   # DOM-only React UI — no Three.js in here
│   ├── SearchBar/                # Live-filter dropdown, writes flyTarget to store
│   ├── InfoPanel/                # Company detail card, reads selectedCompany from store
│   ├── SectorLegend/             # Color-coded sector list
│   └── HUD/                      # Title, stats, nav hints
├── hooks/
│   ├── useCompanyData.ts         # Orchestrates static JSON + Finnhub batch fetch + cache
│   └── useFlyTo.ts               # Reads flyTarget from store for CameraController
├── store/
│   └── cityStore.ts              # Zustand: selectedCompany, flyTarget, sectorFilters, mode
└── data/
    ├── types.ts                  # Company, BuildingDims, BuildingRef interfaces
    ├── constituents.json         # Static S&P 500 list — refreshed quarterly from Datahub.io CSV
    ├── companies.ts              # FALLBACK_COMPANIES — top 50 typed subset, last-resort baseline
    └── sectors.ts                # SECTOR_COLORS + GICS sector normalisation map
```

---

## 4. Data Schema

```ts
// src/data/types.ts — canonical shape used everywhere
interface Company {
  ticker:       string;   // 'AAPL'
  name:         string;   // 'Apple Inc.'
  marketCap:    number;   // billions USD
  price:        number;   // USD per share
  change:       number;   // daily % change, signed
  sector:       string;   // normalised key matching SECTOR_COLORS
  beta?:        number;   // from Finnhub /stock/metric
  shares?:      number;   // billions outstanding, from Finnhub /stock/metric
  week52High?:  number;
  week52Low?:   number;
  exchange?:    string;
}
```

The Datahub.io CSV uses GICS sector names. Normalise them in `sectors.ts` before storing — e.g. `'Information Technology' → 'Technology'`, `'Financials' → 'Finance'`, `'Communication Services' → 'Technology'`.

---

## 5. Visual Theme — Night Owl

Spy City uses a **Night Owl** dark theme throughout. Every visual decision should reinforce the feeling of a city seen from above at 2am — deep blacks, neon bleeds, amber street pools, and the occasional blue-white mooncast.

**Colour palette:**
- Sky / background: `#000814` (near-black deep navy)
- Ground / asphalt: `#030810` (slightly lighter than sky — subtle separation)
- Roads — streets (2-way): `#0a0f1a` asphalt with single dashed yellow `#ffaa00` centre line
- Roads — boulevards (4-lane, every 4 blocks): `#0d1420` slightly lighter asphalt, double yellow centre line + two white `#cccccc` lane dividers
- Sidewalk strips: `#1a2030` thin band between road edge and building face
- Intersection pads: same colour as the wider of the two meeting roads
- Ambient fog: `FogExp2 #000814` density `0.0022` — distant buildings dissolve into darkness
- Window lights: warm amber `#ffe080`, cool blue-white `#a8d8ff`, soft yellow `#ffcc66` — 70% lit, 30% dark
- Neon signs: sector colour at full saturation with additive blending — bleeds light onto surrounding geometry
- Street lamps: warm sodium `#ffffaa` point lights, radius ~24 units, pooling on road surface
- Antenna blink: deep red `#ff2200` → `#330000` on/off via sin wave
- Moon: `#ddeeff` sphere with `#4488bb` halo, positioned high in sky
- Stars: 5,000 points, hemisphere distribution, mix of 1.2px and 2.5px sizes

**Roads — visible geometry requirements:**
Roads are actual geometry planes between city blocks, not gaps or grid lines. Two tiers:
- **Streets (12 units wide):** fill space between every pair of adjacent blocks. Single dashed yellow centre line (canvas texture or repeated plane). Sidewalk strip (2 units, `#1a2030`) on each side where it meets the block edge.
- **Boulevards (26 units wide):** replace streets every 4 blocks in both X and Z axes. Double yellow centre divider + two white lane-divider lines. Wider lamp posts at boulevard intersections.
- All road planes sit at `y = 0.06` above ground to prevent z-fighting.
- Intersection pads fill the square where two roads cross — same colour as the wider road.
- Street lamps at every block corner (street×street) and every boulevard intersection.

**Atmosphere:**
- Directional moonlight from upper-right, colour `#4466aa`, intensity `0.4`
- Ambient light `#102040`, intensity `1.0` — dark but not pitch black
- City-centre pulsing point light `#0033aa` — slow sin-wave intensity `1.8 ± 0.5`
- Outer glow ring at city perimeter — `#0033aa`, animated opacity `0.12 ± 0.05`

---

## 6. City Layout & Building Dimension Math

### City layout — block-based grid (git-city style)

The old layout placed one building per grid cell at intersection points. The new layout groups buildings into **city blocks** exactly as git-city does — roads define the grid, buildings sit *inside* blocks.

---

**Layout hierarchy (small → large):**

```
SLOT       — space for 1 building (building footprint + sidewalk setback on all sides)
BLOCK      — 2×2 slots = 4 buildings per block (the fundamental city unit)
STREET     — 2-way road between adjacent blocks
BOULEVARD  — 4-lane wide road, appears every 4 blocks in both axes
SUPERBLOCK — group of 4×4 blocks bounded by boulevards on all sides
```

---

**Dimension constants:**

| Constant | Value | Description |
|---|---|---|
| `SLOT` | 24 units | One building slot (building + sidewalk on each side) |
| `SIDEWALK` | 2 units | Setback from road edge to building face, all sides |
| `BLOCK` | 48 units | 2 × SLOT — footprint of one city block |
| `STREET` | 12 units | Regular 2-way road between blocks |
| `BLVD` | 26 units | 4-lane boulevard every 4 blocks |
| `MAX_BASE` | 20 units | Max building footprint = SLOT − 2 × SIDEWALK |

A building's calculated base from market cap is **clamped to MAX_BASE**. Buildings narrower than MAX_BASE get natural visual setback from the road.

---

**Block interior — 2×2 slot arrangement:**

```
┌────────────────────────────┐
│  [slot 0]  │  [slot 1]     │  ← row 0 of block
│  building  │  building     │
├────────────┼───────────────┤
│  [slot 2]  │  [slot 3]     │  ← row 1 of block
│  building  │  building     │
└────────────────────────────┘
        ↑ 48 × 48 units
```

Each slot centre within a block (local coordinates, block origin at 0,0):
- Slot 0: `(-12, -12)`
- Slot 1: `(+12, -12)`
- Slot 2: `(-12, +12)`
- Slot 3: `(+12, +12)`

---

**Superblock — 4×4 city blocks:**

One superblock contains 16 blocks (64 buildings). Streets between blocks inside the superblock, boulevards on the superblock boundary.

```
Width of one superblock:
  = 4 × BLOCK + 3 × STREET
  = 4×48 + 3×12
  = 192 + 36 = 228 units

Superblock pitch (superblock width + boulevard):
  = 228 + BLVD = 254 units
```

---

**Block world position formula:**

Given block index `[blockCol, blockRow]`:

```
superCol   = floor(blockCol / 4)
superRow   = floor(blockRow / 4)
localCol   = blockCol % 4
localRow   = blockRow % 4

blockX = superCol × 254  +  localCol × (BLOCK + STREET)
blockZ = superRow × 254  +  localRow × (BLOCK + STREET)
```

Building world position = blockX/Z + slot local offset.

---

**Total city layout for 503 companies:**

503 companies ÷ 4 per block = **126 blocks** (last block has 3 companies).

126 blocks → `ceil(√126) = 12` columns × `ceil(126/12) = 11` rows = **132 block slots** (9 empty).

City grid = 3 superblocks wide × 3 superblocks tall (3×3 = 9 superblocks = 144 block slots, 18 empty at edges).

Total city footprint ≈ `3 × 254 = 762 × 762 world units`.

---

**Road geometry — what to render:**

| Road type | Width | Rendered as | Markings |
|---|---|---|---|
| Street (2-way) | 12 units | `PlaneGeometry` dark asphalt `#0a0f1a` | Single dashed yellow centre line |
| Boulevard (4-lane) | 26 units | `PlaneGeometry` slightly lighter `#0d1420` | Double yellow centre line, two white lane lines |
| Sidewalk strip | 2 units each side | Thin `PlaneGeometry` `#1a2030` | None |
| Intersection pad | STREET × STREET or BLVD × BLVD | Solid plane, same as road | None |
| Block interior | — | Ground plane colour `#030810` | None — buildings are surrounded by sidewalk setback |

Roads are **not grid lines** — they are actual geometry planes filling the space between blocks. The ground plane beneath everything is `#030810`. Roads sit at `y = 0.06` (just above ground plane to prevent z-fighting).

Street lamps placed at every block corner (where street meets street) and every boulevard intersection. Boulevard intersections get taller lamp posts.

---

**Building placement — randomised within blocks:**

Companies are shuffled using a seeded Fisher-Yates shuffle before block assignment. Market cap controls building *height and width* — tall/wide buildings are distributed across all superblocks rather than concentrated in one corner. Seed with total constituent count for stable deterministic layout that refreshes naturally on quarterly constituent updates.

Within each block, the 4 companies assigned to that block are also randomly ordered across the 4 slot positions (slot 0–3 above).

---

**Building dimension math (unchanged):**

- Height: `max(8, log(mcap) / log(maxMcap) × 185)` — log scale, Apple ≈185, smallest ≈20.
- Base: `min(MAX_BASE, max(5, √(mcap / maxMcap) × 22 + 4))` — clamped to 20 to fit slot.
- Volume is intentionally not linear to market cap — cinematic over mathematical purity.
- InfoPanel only (Option B): `volume = mcap / unitValue`. Show as "Volume ≈ $3.2T market cap."
- Floor count: `floors = round(mcap / (maxMcap / 500))`. Max 500 floors. "1 floor ≈ $6.4B."

---

## 7. API Integration — Current Implementation

### Data sources

| Job | Source | How |
|---|---|---|
| S&P 500 constituent list (ticker + name + sector) | **Static JSON** committed to repo | Converted from Datahub.io CSV — no API call, no key needed |
| Live price, market cap, daily change | **Finnhub** | Batch-fetched, 60 calls/min free tier |
| Beta, 52w high/low, shares outstanding | **Finnhub** | `/stock/metric` — on-demand per building click |
| Company name, exchange | **Finnhub** | `/stock/profile2` — on-demand per building click |

FMP is **not used** — its S&P 500 constituent endpoint requires a paid plan. It may be reconsidered in a later stage for historical price data (time machine feature).

---

### Constituent list — static JSON

**Source:** Datahub.io S&P 500 dataset → `https://datahub.io/core/s-and-p-500-companies`
**Original format:** CSV only (`constituents.csv`) — no JSON version exists on Datahub.io.
**Our format:** Manually downloaded CSV, converted to JSON, committed as `src/data/constituents.json`.

CSV columns available: `Symbol`, `Security`, `GICS Sector`, `GICS Sub-Industry`, `Headquarters Location`, `Date added`, `CIK`, `Founded`.

Fields we use: `Symbol` → `ticker`, `Security` → `name`, `GICS Sector` → `sector` (normalised via `GICS_SECTOR_MAP`).

GICS sector names from Datahub must be normalised to match `SECTOR_COLORS` keys:

| GICS Sector (raw) | Normalised |
|---|---|
| Information Technology | Technology |
| Financials | Finance |
| Health Care | Healthcare |
| Consumer Discretionary | Consumer |
| Consumer Staples | Consumer |
| Communication Services | Technology |
| Industrials | Industrial |
| Energy | Energy |
| Materials | Materials |
| Real Estate | Real Estate |
| Utilities | Utilities |

#### Quarterly update process
The S&P 500 rebalances ~4× per year (March, June, September, December). When a rebalancing is announced:
1. Download fresh CSV from `https://datahub.io/core/s-and-p-500-companies/_r/-/data/constituents.csv`
2. Convert to JSON: `node scripts/csv-to-json.js` (script in repo)
3. Replace `src/data/constituents.json`
4. Commit with message: `chore: refresh S&P 500 constituents YYYY-MM`

The conversion script lives at `scripts/csv-to-json.js`. It reads `constituents.csv`, maps column names to our schema, applies sector normalisation, and writes `src/data/constituents.json`. Running it requires no API keys and no external dependencies.

---

### Finnhub — live data

**Free tier:** 60 API calls/minute · No daily cap · Sign up at https://finnhub.io

All Finnhub calls route through `src/app/api/quotes/route.ts` — the browser never calls Finnhub directly.

| Endpoint | Fields used | When fetched |
|---|---|---|
| `/api/v1/quote?symbol={ticker}` | `c` (price), `dp` (% change), `mc` (market cap) | Background batch after render |
| `/api/v1/stock/metric?symbol={ticker}&metric=all` | `beta`, `52WeekHigh`, `52WeekLow`, `sharesOutstanding` | On-demand, building click |
| `/api/v1/stock/profile2?symbol={ticker}` | `name`, `finnhubIndustry`, `exchange` | On-demand, building click |

Note: `sharesOutstanding` is in millions — divide by 1000 for billions. Market cap from `mc` is in millions — divide by 1000 for billions.

#### Rate limit strategy

503 companies × 1 quote call = 503 calls. At 60/min = ~9 minutes straight if sequential — too slow. Batch in **chunks of 55 tickers with 1,100ms between chunks** (just under the 60/min ceiling):

1. **Instant (page load):** Import `constituents.json` directly — city renders immediately with base data (ticker, name, sector). No API call needed for initial render.
2. **Background batch (after render):** Fire Finnhub `/quote` for all 503 tickers in chunks. Buildings update progressively (height/width animate to true market cap values) as each chunk resolves.
3. **On-demand (building click):** Fetch `/stock/metric` + `/stock/profile2` for the clicked ticker only. Show skeleton in InfoPanel until resolved. Cache per-ticker indefinitely.

---

### Caching architecture — two layers

**Server (`unstable_cache` — Next.js built-in, primary):**
- Wraps the Finnhub batch quote fetch with `revalidate: 86400` (24h).
- Shared across all visitors — Finnhub is called once per day server-side, not per user.
- Survives serverless cold starts on Vercel.
- Upgrade path: replace with Upstash Redis (`@upstash/redis`) if traffic scales — one-line change in the route handler.

**Client (`localStorage` — secondary):**
- Key: `spy-city_v2` · TTL: 24h · Shape: `{ ts: number, data: Company[] }`
- Serves stale data instantly on repeat visits while server refreshes in background.
- Per-ticker metrics: `spy-city_metric_{ticker}` · No expiry (beta/52w change slowly).

**Fallback chain:** server cache → `localStorage` → `constituents.json` (static import, always available). City never renders blank.

---

### Environment variables

```
# .env.local (never committed — in .gitignore)
FINNHUB_API_KEY=your_key_here    # https://finnhub.io — free tier, instant signup

# .env.example (committed — contributor template)
FINNHUB_API_KEY=your_key_here
```

Only one API key needed. No FMP key. API key is server-side only — read exclusively in `route.ts` files, never imported into client components or `src/city/`.

---

## 8. InfoPanel Fields

Shown on building click. Fields without `?` are always available (from fallback data). Fields with `?` render as skeleton until on-demand Finnhub fetch resolves.

| Field | Source | Notes |
|---|---|---|
| Ticker, Name, Sector | `constituents.json` static import | Always present, no API needed |
| Price, Daily change | Finnhub quote | Batch-fetched |
| Market cap, Rank | Derived | marketCap field + sort index |
| Beta | Finnhub metric? | On-demand |
| Shares outstanding | Finnhub metric? | On-demand, ÷1000 for billions |
| 52-week high/low | Finnhub metric? | On-demand |
| Building volume | Derived (Option B) | "Volume ≈ $3.2T market cap" |
| Floor count | Derived | "500 floors · 1 floor ≈ $6.4B" |

---

## 9. Camera Controller Behavior

### git-city deep analysis

**Library:** git-city uses `@react-three/drei`'s `<CameraControls>` component — a React wrapper around the `yomotsu/camera-controls` npm package. This is **not** plain `OrbitControls`. The distinction matters because `camera-controls` exposes programmatic transition APIs (`setLookAt`, `rotateTo`, `dollyTo` with `enableTransition: true`) that OrbitControls does not. These APIs are what make git-city's building selection and fly-to animations smooth without any manual `useFrame` lerp code.

---

### git-city UX behavior — complete prompt list

The following behaviors were observed from the live site and confirmed against the `camera-controls` API. Implement every one of these in `CameraController.tsx`.

**FREE NAVIGATION MODE (no building selected)**

1. **Vertical orbit is clamped** — user can tilt from a high aerial angle down toward the horizon but cannot go below ground level or flip over the top of the scene. The camera is locked to a polar band of roughly 5°–80° from the vertical axis. Going underground or looking straight up is impossible.

2. **Horizontal orbit is unlimited** — azimuth is fully free, no min/max. User can spin 360° continuously with no restriction.

3. **Zoom is clamped** — user cannot zoom closer than ~25–30 world units (prevents clipping through building walls) and cannot zoom further than ~600–700 units (at which point the city disappears into fog anyway). Zoom-to-cursor is enabled so the zoom centres on whatever the mouse is hovering over, not the scene origin.

4. **Pan is disabled** — there is no right-click pan / middle-click truck. The orbit target stays anchored to the city centre. This prevents users from accidentally panning the camera off into empty black space where nothing exists. The only way to move the orbit target is by selecting a building.

5. **All movement has damping inertia** — rotation, zoom, and any transition decelerates smoothly (`smoothTime ≈ 0.12s`). There is no instant snap to a new position. Releasing the mouse causes the camera to coast briefly then stop, like dragging through thick air.

6. **Default aerial position** — the camera starts at a high, slightly tilted bird's-eye view. Polar angle ≈ 0.6 rad (≈ 34° from vertical), distance ≈ 280–300 units, looking at city centre. This position is also the ESC reset target.

7. **Camera cannot go below y=0** — the ground plane is a hard floor. If the user tries to orbit below the horizon the polar angle clamps and the camera slides along the boundary, never passing through the ground.

**BUILDING SELECTED MODE (on click or search result)**

8. **Camera immediately enters a top-down transition** — on building click, `setLookAt` fires with `enableTransition: true`. The camera smoothly relocates to a position above and slightly in front of the selected building. The transition takes ~0.6–0.8s (governed by `smoothTime`, no manual timing needed).

9. **View angle snaps to near-top-down** — polar angle transitions to ≈ 0.25–0.30 rad (≈ 14–17° from vertical). This is **not** perfectly overhead — a perfectly top-down view loses the building's height and depth. The slight tilt keeps the roof, neon sign, and upper facade all visible simultaneously. This is the key visual feel git-city has: you are looking almost straight down at the selected building but can still perceive it as a 3D structure.

10. **Orbit target moves to building** — `setLookAt` sets the target (look-at point) to the upper portion of the selected building (`building.h * 0.65` height). This means the building is centred in the viewport, not the ground position.

11. **Distance collapses to building scale** — camera dollies in to approximately `building.h * 2.5 to 3.0` distance, clamped to a minimum of ~45 units. Tall buildings (Apple, Microsoft) get a higher orbit than short buildings, keeping the selected building framed at roughly the same screen proportion regardless of size.

12. **User can still orbit freely while building is selected** — after the snap-to-top-down transition completes, the user can drag to orbit around the selected building. The camera pivot is now the building, not the city centre. Polar angle constraints remain active (no underground). Azimuth remains unlimited.

13. **Polar angle constraint relaxes during selection** — in free navigation `maxPolarAngle` is ~80°. While a building is selected, `maxPolarAngle` is relaxed to ~85° so the user can tilt more toward street-level for a dramatic building face view. Reverts to 80° on deselect.

14. **Building stays centred while zooming** — dolly-to-cursor is still active, so zooming while a building is selected keeps the building in frame rather than zooming toward the scene origin.

15. **Deselect (ESC or click empty ground)** — `setLookAt` fires back to default aerial position with `enableTransition: true`. The camera smoothly returns to the bird's-eye overview. `selectedTicker` is cleared in Zustand, `SelectionBeam` unmounts, InfoPanel closes.

16. **No pan during building selected mode** — panning remains disabled. The only way to change the orbit target from one building to another is to click a different building, which triggers a new `setLookAt` transition directly between the two buildings without returning to aerial first.

17. **Search fly-to is the same as click, but from further** — the initial distance is `building.h * 3.5` instead of `building.h * 2.8`. This gives a slightly wider contextual view when arriving from search (user may not know where in the city the building is), then the user can zoom in manually.

**TRANSITION ANIMATION QUALITIES**

18. **All transitions use cubic ease-in-out feel** — `camera-controls` `smoothTime` property creates natural deceleration. Set `smoothTime = 0.15` for a noticeable but not sluggish feel.

19. **No transition interruption jank** — if the user clicks a second building before the first transition finishes, `setLookAt` to the new target fires immediately from the current (mid-transition) camera position. `camera-controls` handles this cleanly — there is no need to cancel or await the previous transition.

20. **WASD / arrow key flight is disabled** — git-city has no keyboard flight mode. Free-flight (WASD) is a Spy City extension, but it must be disabled while a building is selected to prevent conflicting with the constrained selected-building orbit. Re-enable on deselect.

---

### Spy City — CameraController implementation spec

**Upgrade:** Replace drei `<OrbitControls>` with drei `<CameraControls>` in `CameraController.tsx`. Install: `npm install camera-controls` (drei's component wraps this automatically).

**Normal navigation constraints:**

| Property | Value | Reason |
|---|---|---|
| `minPolarAngle` | `0.05` rad | No flipping over the top |
| `maxPolarAngle` | `Math.PI * 0.44` (~79°) | No underground view |
| `minDistance` | `25` | No clipping into buildings |
| `maxDistance` | `700` | City disappears into fog beyond this |
| `smoothTime` | `0.15` | Weighted, natural inertia |
| `draggingSmoothTime` | `0.15` | Consistent feel while dragging |
| `dollyToCursor` | `true` | Zoom to mouse hover point |
| `mouseButtons.right` | `ACTION.NONE` | Pan disabled |
| `mouseButtons.middle` | `ACTION.DOLLY` | Scroll = zoom |

**Default + ESC reset position:**
- Camera: `[0, 200, 280]` · Target: `[0, 30, 0]` · Polar ≈ `0.62` rad

**On building click / search fly-to:**
- Camera position: `[cx + b*1.2, h*2.2, cz + b*1.8]`
- Target: `[cx, h*0.65, cz]`
- Polar: `0.28` rad (≈16° from vertical)
- Distance: `h * 2.8` (click) or `h * 3.5` (search), min `45`
- All via `cameraControls.current.setLookAt(px, py, pz, tx, ty, tz, true)`

**CameraController.tsx responsibilities:**
- Mount `<CameraControls makeDefault>` with constraints above.
- `useEffect` on `flyTarget` from store → call `setLookAt` with building coords.
- `useEffect` on `selectedTicker` → relax/restore `maxPolarAngle` (79° → 85° → 79°).
- `useEffect` on ESC keydown → reset to default aerial.
- No raycasting here — click detection stays in `<Building onClick>`.
- No state exposed outside — all driven by Zustand store changes.

---

## 10. Building Selection — Light Beam & Minimap Stats

### git-city reference analysis

git-city's building customisation system includes purchasable items named **Spotlight**, **Particle Aura**, and **Lightning Aura** that emit vertical light effects above buildings. These are implemented as decorative mesh effects using additive blending — visible cone geometry rendered over the building, not a standard Three.js light source. Their core selection interaction is fly-to camera + profile popover; the beam effects are cosmetic upgrades layered on top.

For Spy City we implement the beam as a **permanent selection indicator** (not a purchasable cosmetic), triggered on click.

---

### Selection beam — implementation spec

The beam is a composite of three layered elements, all mounted inside the selected `<Building>` group and torn down when selection changes.

**1. Vertical cone beam (`SelectionBeam.tsx`):**
- Geometry: `CylinderGeometry(topRadius=4, bottomRadius=0.5, height=300, radialSegments=16, openEnded=true)`
- Material: `MeshBasicMaterial`, additive blending (`THREE.AdditiveBlending`), `depthWrite: false`, `transparent: true`, opacity animated `0.08–0.18` via slow sin pulse
- Color: sector color of the selected building (from `SECTOR_COLORS`)
- Positioned at building top, pointing straight up
- Do **not** use drei `<SpotLight>` for this — the volumetric spotlight cone points downward and requires a depth buffer. The upward beam is simpler as a pure geometry cone with additive blending, which is also how most city-game selection beams are implemented (zero performance cost, works without post-processing)

**2. Ground ring halo:**
- Geometry: `RingGeometry(innerRadius=b*0.55, outerRadius=b*0.75, segments=64)`
- Material: additive blending, same sector color, opacity pulses `0.15–0.4`
- Rotated flat on the ground plane (`rotation.x = -Math.PI/2`), positioned at `y=0.05`
- Creates the "summoning circle" look at the building base

**3. Roof point light:**
- `<pointLight>` at building top, sector color, intensity `1.2`, distance `building_height * 1.5`
- Washes sector color light onto adjacent building faces and road surface
- Only mounted when a building is selected (zero cost when nothing selected)

**4. Building emissive pulse:**
- On selection: set the building body's `material.emissive` to a dim version of sector color (`0x` + dim hex), intensity fades in over 0.3s
- On deselect: `emissive` back to `#000000`
- Animates via `useFrame` lerping `emissiveIntensity` between `0` and `0.25`

**Beam animation (`useFrame`):**
- `beamOpacity = 0.08 + sin(time * 1.2 + phase) * 0.05` — gentle breathe
- `ringOpacity = 0.2 + sin(time * 0.8) * 0.12` — slower pulse, offset from beam
- `ringScale = 1.0 + sin(time * 0.6) * 0.04` — subtle ring expand/contract
- Phase offset = building index × 0.3 so multiple selections (if ever added) don't sync

**State management:**
- `cityStore.selectedCompany` holds the currently selected company (already in store)
- `cityStore.selectedTicker` (add this) holds ticker string so `<Building>` can check `ticker === selectedTicker` and conditionally render `<SelectionBeam>`
- Only one beam exists in the scene at a time — no array of beams

**Component tree:**
```
<Building ticker="AAPL" ...>
  <mesh>...</mesh>           {/* building body */}
  <NeonSign />
  <TickerLabel />
  {isSelected && <SelectionBeam height={h} base={b} color={sectorColor} />}
</Building>
```

**File:** `src/city/SelectionBeam.tsx` — single exported component, no props except `height`, `base`, `color`.

---

### Minimap — selected building stats

The minimap is already implemented as a 2D canvas overlay. When a building is selected, the minimap panel expands to show a compact company stats block anchored to the building's 2D minimap position.

**Stats displayed in minimap on selection:**
- Ticker (large, sector color)
- Company name (small, muted)
- Price + daily change % (color-coded green/red)
- Market cap rank badge (e.g. `#3`)
- Sector color dot

**Implementation approach:**
- The minimap canvas draws a glowing dot at the selected building's grid position (XZ → minimap UV transform)
- A small DOM tooltip panel is absolutely positioned over the minimap canvas at the dot's pixel coordinates
- Panel is a React component reading `selectedCompany` from Zustand store
- The dot pulses (canvas `arc` redrawn each frame with varying alpha) to match the 3D beam pulse

**Do not** use `<Html>` from drei for the minimap stats — these are DOM elements positioned over the minimap canvas, not anchored to a 3D world position.

---

## 11. What Is Complete

**Stage 1–2 (HTML prototype → Next.js migration):** ✅
- Three.js scene: fog, stars, moon, lighting, glow pulse
- 50-company city: building meshes, window textures, roof caps, antennas, neon signs, ticker sprites
- Road grid with visible asphalt surfaces, lane markings, and kerb edges · Street lamps at every intersection · Sector legend
- Navigation: orbit drag, scroll zoom, WASD/QE flight, ESC reset, click-to-select, search dropdown, fly-to animation
- Zustand store, all DOM overlays (SearchBar, InfoPanel, HUD, SectorLegend)
- Next.js API route scaffolding, Vercel deployment
- Minimap (2D canvas overlay, orthographic top-down render)

**Stage 3 (live data) — in progress:** 🔄
- [x] `constituents.json` committed to `src/data/` (converted from Datahub.io CSV)
- [x] `scripts/csv-to-json.js` conversion script committed
- [x] GICS sector normalisation map in `src/data/sectors.ts`
- [x] Finnhub quote + metrics route (`src/app/api/quotes/route.ts`)
- [x] `useCompanyData` hook with two-layer caching (`unstable_cache` + `localStorage`)
- [ ] Background batch fetch — chunks of 55 tickers, 1,100ms between chunks
- [ ] Progressive building update as chunks resolve (animate height/width change)
- [ ] Migrate city layout to block-based grid: SLOT=24, BLOCK=48, STREET=12, BLVD=26
- [ ] Implement CityLayout.ts — calcBlockPos(blockCol, blockRow, slot) world-position helper
- [ ] Rebuild Ground.tsx with street/boulevard two-tier road planes + sidewalk strips
- [ ] Extend city render from 50 → 503 companies (126 blocks, 3×3 superblocks)
- [ ] `InstancedMesh` migration for 500+ building performance
- [ ] InfoPanel on-demand `/stock/metric` + `/stock/profile2` fetch with skeleton states

**Selection beam + minimap stats — next to implement:** 🔲
- [ ] `SelectionBeam.tsx` — cone + ring + point light composite
- [ ] `cityStore.selectedTicker` added to Zustand store
- [ ] Building emissive pulse on selection
- [ ] Minimap selected-building dot pulse
- [ ] Minimap stats panel (DOM tooltip over canvas)

---

## 12. Pending Stages

**Stage 4 — Visual enhancements:**
- `UnrealBloomPass` via `@react-three/postprocessing` for neon glow (beam benefits significantly from bloom)
- Animated window shader (per-window random flicker via `ShaderMaterial`)
- Rain particles + wet road reflection (`MeshReflectorMaterial` from drei)
- Sector district ground zones with named overlays
- Day/night toggle
- Historical price data integration (time machine, Stage 5 prereq)

**Stage 5 — UX polish:**
- Sector filter panel (buildings sink into ground when hidden)
- Heatmap mode (building color = daily change magnitude)
- Market history time machine (date slider → animate building resize)
- Market Crash Mode (select 2008/2020/2022 → collapse + rebuild animation with particles)
- Portfolio mode (user holdings → owned buildings glow personal color)
- WebXR / Meta Quest support
- Mobile touch joystick

---

## 13. Coding Rules

### Architecture
- R3F declarative JSX only in `src/city/` — never `new THREE.Mesh()` inside React components.
- DOM UI only in `src/components/` — never Three.js imports there.
- `src/city/` and `src/components/` communicate **only** through Zustand store.
- `'use client'` required on any file using R3F hooks, `useFrame`, Zustand, or browser APIs.

### R3F specifics
- `useFrame` for all animation — never `requestAnimationFrame` manually.
- `useMemo` for all canvas textures — never create inside `useFrame` or render.
- No `setState` / Zustand writes inside `useFrame` — causes render loops.
- Fly-to easing: `t < 0.5 ? 4t³ : 1 - (-2t+2)³/2` — cubic ease-in-out, progress += delta × 0.85.

### TypeScript
- No `any`. All financial math functions fully typed.
- Sector lookups null-safe: `SECTOR_COLORS[sector] ?? '#8899aa'`.

### API & security
- API keys server-side only — route handlers exclusively. Never in client components.
- Always proxy through internal `/api/` routes — never call Finnhub or FMP from the browser.
- Fallback chain must always be implemented: server cache → localStorage → `FALLBACK_COMPANIES`.

### Performance
- `InstancedMesh` required when N > 100 buildings — individual meshes hit draw call limits.
- `<Canvas dpr={[1, 2]}>` — never unbounded pixel ratio.
- No Three.js object creation inside `useFrame`.

### Style
- Functional components, named exports (except `page.tsx` / `layout.tsx`).
- One component per file. Tailwind for UI, R3F props for 3D.

---

## 14. Known Issues

| Issue | Severity | Plan |
|---|---|---|
| No `InstancedMesh` yet | Medium | Required before 500-company render in Stage 3 |
| drei `<Html>` overhead at 500 labels | Watch | Replace with `<Sprite>` canvas meshes if perf degrades |
| No mid-flight re-targeting | Low | Cancel fly-to when `flyTarget` changes in store |
| Neon z-fight at close range | Low | Small Z offset + additive blending verification |
| No mobile touch flight | Low | Stage 5 virtual joystick |

---

## 15. Future Ideas

Market Pulse (buildings breathe with trade volume) · Earnings Flash (gold pulse on report date) · Sector Earthquake (sector-wide shake on big drop) · IPO Construction (scaffold animation) · Acquisition Merger (two buildings combine) · Analyst Spotlight (buy/sell colored beams) · Portfolio Mode (owned buildings glow) · Social sticky notes (Supabase realtime) · Market Crash Mode (collapse + rebuild animation) · City Radio (music tied to sentiment) · WebXR

---

## 16. Contributor Quick-Start

```bash
git clone https://github.com/YOUR_USERNAME/spy-city
cd spy-city && npm install
cp .env.example .env.local   # add Finnhub + FMP keys (optional — fallback data works without them)
npm run dev                  # http://localhost:3000
```

Orient yourself: read `dimensions.ts` for building math, `cityStore.ts` for all state, `useCompanyData.ts` for the data pipeline. The 3D scene and UI never talk to each other directly — only through the store.

---

*Single source of truth for GitHub Copilot, Claude, Cursor, and Windsurf. Update this file when a stage completes, a dependency changes, or an architectural decision is made.*
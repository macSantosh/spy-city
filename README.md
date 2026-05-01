# Spy City

Spy City turns the S&P 500 into a navigable 3D night city. Each company is rendered as a building whose scale is driven by market capitalization, with sector color, live quote data, and a camera system designed for cinematic fly-through exploration.

This repo is the production Next.js version of the project and is intended to be public, contributor-friendly, and safe to run without exposing API keys.

## Highlights

- Next.js App Router with TypeScript
- React Three Fiber + drei for the 3D scene
- Zustand for shared scene/UI state
- Finnhub proxy route for server-side quote access
- Fallback static constituent data so the city still renders without API keys

## Stack

- Next.js 16
- React 19
- TypeScript
- Three.js
- React Three Fiber
- Zustand
- Tailwind CSS v4

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure local environment variables

Use either of these local-only approaches:

```bash
cp .env.example .env.local
```

Or:

```bash
cp env.local.sh.example env.local.sh
source env.local.sh
```

Required variable:

```bash
FINNHUB_API_KEY=your_key_here
```

### 3. Start the app

```bash
npm run dev
```

Open http://localhost:3000

## Available Scripts

- `npm run dev` starts the development server
- `npm run build` builds the production app
- `npm run start` runs the production build
- `npm run lint` runs linting if configured by Next.js in the local environment

## Project Status

Current focus is Stage 3: live data integration, larger city layout migration, and performance work for the full S&P 500 render.

Implemented already:

- Core 3D city scene
- Search, HUD, info panel, minimap
- Zustand-powered selection and camera state
- Finnhub API proxy route
- Local fallback data path

In progress:

- Background batched quote refresh
- Full 503-company block layout
- Progressive building updates
- Selection/minimap polish

## Data Sources

- S&P 500 constituent source: DataHub S&P 500 dataset
- Live market data: Finnhub

This project is for visualization and educational purposes and should not be treated as investment advice.

## Open Source Notes

- Real API keys must never be committed
- Local secrets belong in `.env.local` or `env.local.sh`
- Only `.env.example` and `env.local.sh.example` should be committed

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for workflow and contribution expectations.

## Security

See [SECURITY.md](SECURITY.md) for how to report sensitive issues.

## License

MIT. See [LICENSE](LICENSE).
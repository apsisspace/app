# Apsis Space

Apsis Space is a browser-based, AI-powered satellite tracker. It renders an interactive 3D Earth (CesiumJS) and propagates orbital positions from Celestrak TLEs in real time (satellite.js / SGP4). The v1 milestone tracks the International Space Station; later milestones expand to the full active catalog and an AI query layer for plain-English questions about the sky overhead.

## Quick start

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`). You should see Earth and a pink dot labeled **ISS (ZARYA)** moving across the surface as time passes.

Optional — for premium imagery/terrain, copy `.env.example` to `.env.local` and add a free Cesium ion token:

```bash
cp .env.example .env.local
# then set VITE_CESIUM_ION_TOKEN=your_token
```

Get a free token at <https://ion.cesium.com/> → Access Tokens. Without it, Apsis Space uses OpenStreetMap imagery, which works with zero setup.

## Tech stack

- **Vite** + **React 19** + **TypeScript** (strict mode)
- **CesiumJS** + **Resium** — 3D Earth and entity rendering
- **satellite.js** — client-side SGP4 propagation
- **TanStack Query** — TLE fetch + caching
- **Tailwind CSS** — styling (minimal for v1)
- **Zustand** — client state (to be added when needed)
- Target deploy: **Vercel** (Edge Functions for the future AI proxy)

## Roadmap

- **v1 — ISS demo (this milestone).** 3D Earth + one satellite propagated client-side and rendered live.
- **v2 — Full catalog.** Pull the active catalog from Celestrak, render with LOD / point primitives, add pick-to-inspect and pass predictions. Likely move propagation server-side for scale.
- **v3 — AI layer.** "Is the ISS visible from Berlin tonight?" / "What's that bright thing?" — answered via Claude Haiku behind a Vercel Edge Function proxy with per-IP and global rate/budget caps.
- **v4 — Pro tier.** User accounts, saved views, higher query limits, premium imagery/terrain via Cesium ion.

## Project layout

```
src/
  components/
    Globe.tsx           CesiumJS viewer wrapper
    SatelliteLayer.tsx  Renders satellites as animated entities
  hooks/
    useSatellites.ts    TanStack Query hooks (v1: ISS only)
  lib/
    celestrak.ts        Celestrak TLE fetcher
    propagator.ts       satellite.js wrapper (SGP4 → geodetic)
  types/
    satellite.ts        TLE / position / Satellite types
  App.tsx
  main.tsx
  index.css
```

## License

TBD.

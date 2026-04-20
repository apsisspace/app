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

## Features (v2)

- Loads Celestrak's **active** catalog (~10,000 satellites) on startup.
- All satellites propagated client-side (SGP4) once per second and rendered as a single Cesium `PointPrimitiveCollection` for throughput.
- Cesium `requestRenderMode` is on — idle GPU usage is effectively zero between ticks.
- **Click** any satellite to open a side panel with name, NORAD ID, COSPAR ID, orbital period, inclination, and TLE epoch.
- **Search** by name in the top-center input; Enter (or click a result) highlights the satellite in teal and flies the camera to it.
- Selected state lives in a Zustand store; the point layer subscribes imperatively so selection changes never trigger a React re-render of the globe.

## Roadmap

- **v1 — ISS demo.** 3D Earth + one satellite propagated client-side and rendered live. ✓
- **v2 — Full catalog (current milestone).** Celestrak active group, point-primitive rendering, click-to-inspect, search-to-focus. ✓
- **v3 — AI layer.** "Is the ISS visible from Berlin tonight?" / "What's that bright thing?" — answered via Claude Haiku behind a Vercel Edge Function proxy with per-IP and global rate/budget caps.
- **v4 — Pro tier.** User accounts, saved views, higher query limits, premium imagery/terrain via Cesium ion. Possibly server-side propagation for larger catalogs and pass predictions.

## Project layout

```
src/
  components/
    Globe.tsx              CesiumJS viewer wrapper (requestRenderMode on)
    SatelliteLayer.tsx     PointPrimitiveCollection + 1 Hz batch propagate
    SearchBar.tsx          Top search input
    SidePanel.tsx          Right-side selected-satellite detail
  hooks/
    useSatelliteCatalog.ts TanStack Query — active catalog TLEs
    useSelectedSatellite.ts Zustand-backed selection hooks
  lib/
    celestrak.ts           TLE fetch + parse (single + group)
    propagator.ts          satellite.js wrapper (SGP4 → geodetic)
    tleMetadata.ts         Derive COSPAR / period / inclination / epoch
  stores/
    selection.ts           Zustand store for current selection
  types/
    satellite.ts           TLE / position / Satellite types
  App.tsx
  main.tsx
  index.css
```

## License

TBD.

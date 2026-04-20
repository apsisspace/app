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

- Loads Celestrak's **active** catalog (~10,000 satellites) on startup, via a Vercel Edge proxy + localStorage cache (see Data flow below).
- All satellites propagated client-side (SGP4) once per second and rendered as a single Cesium `PointPrimitiveCollection` for throughput.
- Cesium `requestRenderMode` is on — idle GPU usage is effectively zero between ticks.
- **Click** any satellite to open a side panel with name, NORAD ID, COSPAR ID, orbital period, inclination, and TLE epoch.
- **Search** by name in the top-center input; Enter (or click a result) highlights the satellite in teal and flies the camera to it.
- Selecting a satellite hands the camera to Cesium's `trackedEntity` mode — zoom/orbit are relative to the satellite, and the camera follows it through its orbit.
- Selected state lives in a Zustand store; the point layer subscribes imperatively so selection changes never trigger a React re-render of the globe.

## Data flow

```
browser ──► localStorage cache (1 h TTL) ──► /api/catalog ──► Celestrak
                ▲                                ▲                │
                └────── write on success ────────┘                │
                                 stale fallback ◄──── 1 h memory cache
```

- Browsers can't set `User-Agent` on `fetch()`, and Celestrak 403s default UAs, so the client never hits Celestrak directly. Instead:
- `api/catalog.ts` is a Vercel Edge Function that fetches Celestrak with a proper User-Agent, caches the response in-memory for 1 h per isolate, and falls back to the last-successful response on upstream error (including 403).
- The client first checks a localStorage cache (1 h TTL). Only on miss/stale does it call `/api/catalog`. This keeps Celestrak load near-minimal at any scale.
- In local dev (`npm run dev`), the same Edge Function is served through a small Vite middleware plugin — no `vercel dev` required.

## Roadmap

- **v1 — ISS demo.** 3D Earth + one satellite propagated client-side and rendered live. ✓
- **v2 — Full catalog (current milestone).** Celestrak active group, point-primitive rendering, click-to-inspect, search-to-focus. ✓
- **v3 — AI layer.** "Is the ISS visible from Berlin tonight?" / "What's that bright thing?" — answered via Claude Haiku behind a Vercel Edge Function proxy with per-IP and global rate/budget caps.
- **v4 — Pro tier.** User accounts, saved views, higher query limits, premium imagery/terrain via Cesium ion. Possibly server-side propagation for larger catalogs and pass predictions.

## Project layout

```
api/
  catalog.ts               Vercel Edge Function — Celestrak proxy + cache

src/
  components/
    Globe.tsx              CesiumJS viewer wrapper (requestRenderMode on)
    SatelliteLayer.tsx     PointPrimitiveCollection + 1 Hz batch propagate
    SearchBar.tsx          Top search input
    SidePanel.tsx          Right-side selected-satellite detail
  hooks/
    useSatelliteCatalog.ts TanStack Query — /api/catalog + localStorage
    useSelectedSatellite.ts Zustand-backed selection hooks
  lib/
    catalogCache.ts        localStorage read/write for the TLE blob
    celestrak.ts           TLE parse (client-side) + legacy direct fetchers
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

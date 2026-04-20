# Apsis Space

Apsis Space is a browser-based, AI-powered satellite tracker. It renders an interactive 3D Earth (CesiumJS) and propagates orbital positions from Celestrak TLEs in real time (satellite.js / SGP4). The v1 milestone tracks the International Space Station; later milestones expand to the full active catalog and an AI query layer for plain-English questions about the sky overhead.

## Quick start

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`). You should see Earth and a pink dot labeled **ISS (ZARYA)** moving across the surface as time passes.

There is also an `/about` page that gives a brief overview of the project, how it works, and who built it.

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
- **Smooth motion at display framerate.** SGP4 propagates each satellite once per second into a `next` buffer; every render frame we lerp `prev → next` into the point's position. Same idea Cesium's `SampledPositionProperty` uses internally, applied directly to a single `PointPrimitiveCollection` so 10k satellites stay cheap.
- **Points scale with camera distance** (`NearFarScalar`), so they stay legible close up and visible zoomed out. Crisp — no fuzz.
- **Click** any satellite to open a side panel showing **live altitude (km) and velocity (km/s)**, NORAD ID, COSPAR ID, period + regime tag (LEO/MEO/GEO/HEO), inclination, TLE epoch.
- **Orbit line.** Selected satellite renders its full orbital path as a teal polyline (100 ECEF samples over one period, one-shot on selection).
- **Search** by name in the top-center input; Enter (or click a result) highlights the satellite in teal and flies the camera to it.
- Selecting a satellite hands the camera to Cesium's `trackedEntity` mode — zoom/orbit are relative to the satellite, and the camera follows it through its orbit. The selected point gets a larger pixelSize + teal outline halo.
- Selected state lives in a Zustand store; the point layer subscribes imperatively so selection changes never trigger a React re-render of the globe.
- **Next visible pass** over the user. Opt-in — we request browser geolocation only when the user clicks "Enable location". Location is kept in memory only (never persisted, never sent off-device). Pass search = 24h × 30s steps, gated on satellite elevation > 0°, observer in darkness (sun < −6°), and satellite illuminated (cylindrical Earth-shadow model).

## Features (v3 — AI layer)

- **Ask Apsis**, a bottom-right chat panel, answers plain-English questions about satellites, orbits, and the catalog via **Claude Haiku 4.5**.
- If a satellite is selected when you ask, its NORAD ID, inclination, period, and TLE epoch are injected as context on that turn — so "what's this satellite's altitude range?" just works.
- Strict abuse controls baked in server-side:
  - **20 questions per IP per UTC day.**
  - **$5 global budget per UTC day.** Budget is pre-checked (worst-case) before we spend, and the actual spend is recorded after.
  - Both counters live in Upstash Redis (REST), keyed `ratelimit:<ip>:<YYYYMMDD>` and `budget:<YYYYMMDD>`, with an `EXPIRE` to UTC midnight so keys clean up on their own.
- Input validation on both client and server: max 500 chars, control-character stripped, empty/whitespace rejected.
- Distinct client-side error states for `daily_limit_reached` (429), `daily_budget_reached` (503), validation (400), and network errors.
- System prompt is prompt-cached (`cache_control: ephemeral`); the volatile UTC timestamp is sent as a separate system block so it doesn't invalidate the cache.
- Chat state is local/ephemeral — nothing persists across reloads yet. Chat never triggers Cesium re-renders (the panel sits as a sibling of the globe).

## Data flow

```
browser ──► localStorage cache (1 h TTL) ──► /api/catalog ──► Celestrak
                ▲                                ▲                │
                └────── write on success ────────┘                │
                                 stale fallback ◄──── 1 h memory cache

browser ──► POST /api/query ──► Upstash Redis (per-IP + global)
                                    │
                                    ├── pre-check: IP count, daily $ budget
                                    │
                                    ▼
                               Anthropic (Claude Haiku 4.5)
                                    │
                                    ├── record actual $ spend (INCRBYFLOAT)
                                    │
                                    ▼
                                 { answer }
```

- Browsers can't set `User-Agent` on `fetch()`, and Celestrak 403s default UAs, so the client never hits Celestrak directly. Instead:
- `api/catalog.ts` is a Vercel Edge Function that fetches Celestrak with a proper User-Agent, caches the response in-memory for 1 h per isolate, and falls back to the last-successful response on upstream error (including 403).
- The client first checks a localStorage cache (1 h TTL). Only on miss/stale does it call `/api/catalog`. This keeps Celestrak load near-minimal at any scale.
- `api/query.ts` is a second Vercel Edge Function that owns the Anthropic key (never exposed to the browser), gates each request against both rate counters, calls Claude Haiku, and returns just `{ answer }` or a typed error.
- In local dev (`npm run dev`), both Edge Functions are served through a small Vite middleware plugin — no `vercel dev` required.

## Roadmap

- **v1 — ISS demo.** 3D Earth + one satellite propagated client-side and rendered live. ✓
- **v2 — Full catalog (current milestone).** Celestrak active group, point-primitive rendering, click-to-inspect, search-to-focus. ✓
- **v3 — AI layer (current milestone).** "What's this satellite for?" / "What's a sun-synchronous orbit?" — answered via Claude Haiku behind a Vercel Edge Function with per-IP (20/day) and global ($5/day) caps. ✓
- **v4 — Pro tier.** User accounts, saved views, higher query limits, premium imagery/terrain via Cesium ion. Possibly server-side propagation for larger catalogs and pass predictions. Live visibility predictions (they need the user's location and time, which we don't have yet).

## Project layout

```
api/
  catalog.ts               Vercel Edge Function — Celestrak proxy + cache
  query.ts                 Vercel Edge Function — Claude Haiku + rate limits

src/
  components/
    ChatPanel.tsx          Bottom-right Ask Apsis chat panel
    Globe.tsx              CesiumJS viewer wrapper (requestRenderMode on)
    SatelliteLayer.tsx     PointPrimitiveCollection + 1 Hz batch propagate
    SearchBar.tsx          Top search input
    SidePanel.tsx          Right-side selected-satellite detail
  hooks/
    useChat.ts             Chat state + POST /api/query with selection ctx
    useSatelliteCatalog.ts TanStack Query — /api/catalog + localStorage
    useSelectedSatellite.ts Zustand-backed selection hooks
  lib/
    catalogCache.ts        localStorage read/write for the TLE blob
    celestrak.ts           TLE parse (client-side) + legacy direct fetchers
    passPrediction.ts      Sun position + next-visible-pass search
    propagator.ts          satellite.js wrapper (SGP4 + velocity + orbit sampling)
    tleMetadata.ts         Derive COSPAR / period / inclination / epoch
  stores/
    observer.ts            Zustand store for the user's location (ephemeral)
    selection.ts           Zustand store for current selection
  types/
    chat.ts                Chat message + error shapes
    satellite.ts           TLE / position / Satellite types
  App.tsx
  main.tsx
  index.css
```

## License

TBD.

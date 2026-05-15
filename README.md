# Mongolia Road Trip Planner

A → B route explorer for Mongolia. Type two place names (or hit **Use my location**), get a driving route plus POIs (fuel, cafe, restaurant, hotel, camp, scenic, lakes, viewpoints, attractions, natural landmarks, parks) sampled along the corridor — rendered on a MapLibre map, a start ⇆ destination connector, notable-place cards, category cards, and an AI trip overview.

POC built on free APIs only: **Nominatim** (geocoding + reverse geocoding), **OpenRouteService** (driving directions), **Overpass** (OSM POIs), **Gemini 2.0 Flash** (optional AI overview).

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind v4 · shadcn-style primitives · Plus Jakarta Sans · Material Symbols Outlined
- TanStack Query v5
- MapLibre GL v5 (OSM raster tiles)
- Zod for runtime validation

## 1. Prerequisites

- Node 20+ (`node -v`)
- pnpm 10+ (`pnpm -v`) — `npm i -g pnpm` if missing
- An OpenRouteService API key — sign up at <https://openrouteservice.org/dev/#/signup> (free tier: 2,000 requests/day)
- *(Optional)* A Gemini API key — sign up at <https://aistudio.google.com/apikey> (free tier: 15 RPM, 1500 RPD on `gemini-2.0-flash`). Without it, AI trip overviews are disabled but the app still works.

## 2. Setup

```bash
git clone <this-repo> && cd trip-planner
pnpm install
cp .env.example .env.local
```

Edit `.env.local`:

```
ORS_API_KEY=eyJvcmciOiI1YjN...your_real_key
NOMINATIM_USER_AGENT=mongolia-road-trip/0.1 (you@example.com)
GEMINI_API_KEY=AIza...your_optional_key
```

> Nominatim's usage policy **requires** a real contact email in the User-Agent. If you don't include one, expect HTTP 403s.

## 3. Run locally

```bash
pnpm dev
```

Open <http://localhost:3000>. Try:

- `Ulaanbaatar` → `Khuvsgul`
- `Ulaanbaatar` → `Otgontenger`
- `Ulaanbaatar` → `Gobi`

The map auto-fits to the route bbox. Place markers populate within ~10–20 s the first time, then are cached. Toggle category chips to filter live without re-querying.

## 4. Other scripts

| Command          | Purpose                                |
| ---------------- | -------------------------------------- |
| `pnpm dev`       | Dev server on :3000                    |
| `pnpm build`     | Production build (used by Vercel)      |
| `pnpm start`     | Run the production build               |
| `pnpm typecheck` | Strict TS check, no emit               |
| `pnpm lint`      | ESLint (flat config, Next 16 ruleset)  |

## 5. Architecture

```
src/
├── app/
│   ├── layout.tsx                 Root layout: Plus Jakarta + Material Symbols + QueryProvider
│   ├── globals.css                Tailwind v4 @theme tokens (Stitch design system)
│   ├── (main)/
│   │   ├── page.tsx               Server shell
│   │   ├── _components/           UI:
│   │   │                          - SiteHeader, HeroSearch, RouteSearchForm, FilterBar
│   │   │                          - MapView (flies-to-place on click/random pick)
│   │   │                          - RouteHeader (start ──── destination connector pill)
│   │   │                          - FeaturedPlaces (top scored places with image/rating/description)
│   │   │                          - CategoryGrid + CategoryCard (one card per category,
│   │   │                            click → random place → map flyTo)
│   │   │                          - TripSummary (Gemini AI overview)
│   │   │                          - ResultsLayout, PlaceCard, SkeletonMap, EmptyState, ErrorBanner
│   │   ├── _features/             Hooks: useTripQuery, useFilters, useGeolocation, useSummaryQuery
│   │   └── _utils/                Geo: Haversine, SamplePolyline, DedupePlaces, DistanceAlong,
│   │                              Categories, MapStyle
│   └── api/
│       ├── route/route.ts         POST /api/route    → Nominatim ×2 + ORS
│       ├── places/route.ts        POST /api/places   → sample(15km) + Overpass + dedupe + project
│       ├── reverse/route.ts       GET  /api/reverse  → Nominatim reverse for browser geolocation
│       └── summary/route.ts       POST /api/summary  → Gemini overview (skipped if no key)
├── services/
│   ├── GeocodeService.ts          Nominatim forward + reverse, server-only, 1h cache
│   ├── RouteService.ts            OpenRouteService wrapper, server-only, 24h cache
│   ├── PoiService.ts              Overpass batched query, 12h cache, partial-failure tolerant
│   └── SummaryService.ts          Gemini 2.0 Flash, 24h cache, prompt built from route + places
├── types/                         Coord, RouteResult, Place, PlaceCategory
├── lib/                           Env (zod), QueryProvider, Fetcher (timeout + retry), ServerCache
└── components/ui/                 Button, Input, Card, Skeleton, Icon
```

Data flow:

```
[Browser geolocation] → GET /api/reverse → fills "From"

[Search form]
   ↓ POST /api/route   { from, to }
[GeocodeService ×2] → [RouteService] → { coordinates, distance, duration, bbox }
   ↓ POST /api/places  { coordinates }
[SamplePolyline] → [PoiService batched] → [DedupePlaces] → [project onto polyline]
   ↓ POST /api/summary { route, places }
[SummaryService (Gemini)] → 3-sentence overview (optional)
   ↓
[MapView + RouteHeader + CategoryGrid + TripSummary] (client, React Query cached)
```

Filters are pure client state — toggling a chip updates `visibleCategories`, the map markers rebuild, and the category cards re-aggregate, **without** refetching. Clicking a category card picks a random place from that category and flies the map to it.

## 6. Deploy to Vercel

```bash
pnpm dlx vercel link
pnpm dlx vercel env add ORS_API_KEY production
pnpm dlx vercel env add NOMINATIM_USER_AGENT production
pnpm dlx vercel env add GEMINI_API_KEY production      # optional
pnpm dlx vercel --prod
```

Or in the Vercel dashboard: **Project → Settings → Environment Variables** → add `ORS_API_KEY` and `NOMINATIM_USER_AGENT` for Production + Preview, then `Deploy`.

The `/api/places` handler is configured with `maxDuration = 60` (seconds). On Vercel's free Hobby plan, route handlers cap at 60 s — sufficient for our worst-case Overpass batches.

## 7. Common errors

| Symptom                                                          | Cause                                                | Fix                                                                                  |
| ---------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `ORS_API_KEY is missing` on first request                        | `.env.local` not loaded                              | Confirm `.env.local` exists at project root, restart `pnpm dev`                      |
| Nominatim returns HTTP 403                                       | Missing or generic User-Agent                        | Set `NOMINATIM_USER_AGENT` with a real contact email                                 |
| Overpass returns HTTP 406                                        | Same — Overpass also requires a User-Agent           | Same fix; `PoiService` reuses `NOMINATIM_USER_AGENT`                                 |
| `Could not plan the route` for an obviously valid place          | Nominatim couldn't pin it inside Mongolia            | Use more specific names (`Khuvsgul Lake`, `Gobi Gurvansaikhan`)                      |
| `OpenRouteService 403`                                           | Invalid key or daily quota hit (2,000/day free tier) | Verify key in `.env.local`; wait 24 h or upgrade ORS plan                            |
| Sparse / zero markers                                            | Overpass timed out one or more batches               | Retry; this app already tolerates partial failure. Or wait — Overpass is rate-limited |
| `window is not defined` from MapLibre                            | Map component imported without `dynamic` + `ssr:false` | Confirmed safe in our codebase via `ResultsLayout.tsx`                              |
| `maplibre-gl.css not loaded` (controls invisible)                | CSS import missing                                   | The import lives in `MapView.tsx`; do not remove it                                  |
| Hydration warning on font                                        | Fonts loaded twice                                   | Use `next/font` for body font (already done); `<link>` only for Material Symbols     |

## 8. Out of scope (deliberate)

No auth, no DB, no saved trips, no bookings. Ratings are route-aware prominence scores derived from OSM metadata rather than review-platform ratings. No multi-stop routing, no alternative routes, no traffic, no streaming. UI in English. Admin and checkout screens from the source design are intentionally not built.

## 9. Attribution

- Map tiles: © OpenStreetMap contributors — <https://www.openstreetmap.org/copyright>
- Routing: © OpenRouteService — <https://openrouteservice.org/>
- POI data: © OpenStreetMap via Overpass API — <https://overpass-api.de/>
- Hero photo: Unsplash
# mongoliaRoadTrip

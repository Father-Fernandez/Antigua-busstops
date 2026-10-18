# Bus Stop Antigua

A journey planner for the Antigua public bus network — search routes, stops and
fares, explore the map, and download the open data. Built with React + Tailwind
on the front end and SpacetimeDB as the live backend.

## Stack

- **Front end:** React 18, TypeScript, Vite, Tailwind CSS v4
- **Backend:** SpacetimeDB (TypeScript module) — tables + reducers
- **Map:** Leaflet / react-leaflet (OpenStreetMap tiles)
- **Tests:** Vitest

## Project structure

```
bus-system/
├── spacetimedb/            # Server module (tables, reducers, seed data)
│   └── src/
│       ├── schema.ts       # Table definitions
│       ├── index.ts        # Reducers + seeding lifecycle
│       └── seed.ts         # 23 routes / 87 stops
├── src/
│   ├── components/         # UI (planner, map, views, header…)
│   ├── lib/                # journey planner, router, export, theme, config
│   └── module_bindings/    # Auto-generated SpacetimeDB client types
├── docker/                 # nginx config + runtime-config entrypoint
├── Dockerfile
└── public/                 # Icons, manifest, runtime config.js
```

## Development

```bash
npm install
npm run dev            # Vite dev server
```

The client connects to the SpacetimeDB host/database in `.env`
(`VITE_SPACETIMEDB_HOST`, `VITE_SPACETIMEDB_DB_NAME`). At runtime these can be
overridden via `window.__ENV__` (used by the Docker image).

### Working on the module

```bash
npx tsc -p spacetimedb/tsconfig.json --noEmit   # type-check the module
npm run spacetime:generate                       # regenerate client bindings
npm run spacetime:publish                        # publish to Maincloud
npm run spacetime:publish:local                  # publish to a local server
```

## Tests & checks

```bash
npm test          # Vitest (journey planner logic)
npm run typecheck # tsc
npm run build     # production build
```

## Docker

```bash
docker compose up --build      # serve on http://localhost:8080
```

The image builds the client and serves it with nginx, injecting the live
SpacetimeDB target at container start (see `docker/40-runtime-config.sh`).

## Open data

Routes, stops and fares are public and read-only; writes are restricted to
administrators via guarded reducers. See the **Data** page in the app for JSON /
CSV exports and direct SpacetimeDB connection details.

Seed data is derived from [busstopanu.com](https://busstopanu.com); stop
coordinates come from OpenStreetMap / GeoNames, with a few best-effort
placements flagged as approximate.

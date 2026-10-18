# Bus System — Architecture Overview

A real-time bus tracking platform built on **SpacetimeDB** with a **React**
client, modelling the Antigua bus network (routes, stops and fares taken from
**busstopanu.com**).

The backend currently holds the real network: **23 numbered routes** (10, 12, 13,
15, 17, 20, 22, 29B, 30–35, 40, 40B, 41B, 42, 45, 50, 55, 60, 61) terminating at
the East or West Bus Station in St. John's, **87 named stops**, and per-stop
fares. It is published to SpacetimeDB maincloud as `bus-system-qcj1z`.

This document explains how the pieces fit together: the tables, the reducers that
mutate them, the live subscriptions that push changes to clients, and how the
milestones build on each other.

---

## 1. The core idea

SpacetimeDB is a **relational database that is also the server**. There is no
separate application server and no REST/GraphQL API. Instead:

- **Application logic lives inside the database** as a *module* (here, a
  TypeScript module in `spacetimedb/src/`).
- Clients connect over a WebSocket and **subscribe to SQL queries** rather than
  making request/response calls.
- When a reducer mutates a table, SpacetimeDB **automatically pushes the row
  changes** to every client subscribed to that table.

This flips the usual model: instead of the client asking "what's the latest
data?", the client holds a **live, local replica** of the data it subscribed to,
and the database keeps it in sync.

```
                  ┌───────────────────────────────────────────────────────┐
                  │                     SpacetimeDB                        │
                  │                                                       │
                  │   ┌────────────┐      ┌──────────────────────────┐    │
   reducer call   │   │  Reducers  │─────▶│         Tables           │    │
  ────────────────┼──▶│ (mutate    │      │  route, bus_stop,        │    │
                  │   │  state)    │      │  route_stop, fare,       │    │
                  │   └────────────┘      │  route_fare, admin       │    │
                  │                       └────────────┬─────────────┘    │
                  │                                    │ row changes      │
                  └────────────────────────────────────┼──────────────────┘
                                                       │
                            live subscriptions (WS)    │
                                                       ▼
                  ┌───────────────────────────────────────────────────────┐
                  │                    React client                        │
                  │  useTable(...)   → local replica of rows               │
                  │  useReducer(...) → fire-and-forget calls               │
                  └───────────────────────────────────────────────────────┘
```

### Key rules that shape the design

1. **Reducers return nothing.** They are transactional functions that mutate
   state. The client learns the result by subscribing to the tables, not by
   reading a return value.
2. **Reducers are deterministic.** No filesystem, network, wall-clock, or
   external RNG. Use `ctx.timestamp` and `ctx.random` instead.
3. **Reads happen through subscriptions**, not through reducer calls.
4. **`ctx.sender` is the authenticated identity.** Never trust an identity passed
   as an argument to a reducer.
5. **Auto-increment IDs are not sequential.** Gaps are normal — order by an
   explicit column (like `sequence`) instead.
6. **Table `name`s must be snake_case** (`route_stop`, `route_fare`); the
   TypeScript identifiers stay camelCase.

---

## 2. Repository layout

```
bus-system/
├── spacetimedb/                    # The server-side module (runs inside SpacetimeDB)
│   └── src/
│       ├── index.ts                # Tables, reducers, lifecycle hooks, init seeding
│       └── seed.ts                 # STOPS (87) + ROUTES (23) + PLACES (25) seed data
├── src/                            # The React client
│   ├── main.tsx                    # Connection setup + SpacetimeDBProvider
│   ├── App.tsx                     # Page shell + useTable subscriptions
│   ├── index.css                   # Tailwind v4 + heritage @theme palette
│   ├── lib/
│   │   ├── journey.ts              # Journey planning + fare helpers
│   │   ├── journey.test.ts         # Vitest coverage for the fare/planner logic
│   │   ├── places.ts               # Place categories, grouping, helpers
│   │   ├── places.test.ts          # Vitest coverage for place helpers
│   │   ├── router.ts               # Hash routing (`#/page?from=&to=`) + deep links
│   │   ├── config.ts               # Runtime SpacetimeDB host / database
│   │   ├── weather.ts              # Antigua weather (Open-Meteo, no key)
│   │   ├── links.ts                # Links to the original busstopanu.com pages
│   │   └── export.ts               # JSON/CSV dataset builders for downloads
│   ├── components/                 # Header, JourneyPlanner, StopCombobox, MapView,
│   │                               #   ExploreView, RoutesView, StopsView, DataView,
│   │                               #   AdminView, AboutView, WeatherCard,
│   │                               #   LegacyLinks, Footer
│   └── module_bindings/            # Auto-generated types mirroring the module
├── .env                            # VITE_SPACETIMEDB_HOST / _DB_NAME
├── spacetime.json                  # CLI project config (server, database, paths)
├── Dockerfile / docker/            # Multi-stage image (Node build → nginx)
└── package.json                    # Dev/build/generate scripts
```

The `module_bindings/` directory is **generated**, not hand-written. After any
schema change in `spacetimedb/src/index.ts`, regenerate it so the client's
`tables.*` and `reducers.*` stay in sync:

```bash
npm run spacetime:generate
```

> Note: the CLI **skips private tables during codegen**. Every table here is
> public, so all of them appear in the client bindings.

---

## 3. Data model

The schema is split by **access pattern**, not by entity, so subscribers
re-render only the rows that actually change. All network data is `public` so
passengers can read it; writes still go exclusively through reducers, and every
mutating reducer is **admin-guarded** (see §4), so the public can read but not
edit.

| Table              | Public | Purpose                                        | Key / Index                  |
| ------------------ | ------ | ---------------------------------------------- | ---------------------------- |
| `route`            | yes    | A bus line: number, name, terminus, color, description | `id` (pk, autoInc)     |
| `bus_stop`         | yes    | A physical stop with coordinates               | `id` (pk, autoInc)           |
| `route_stop`       | yes    | Join table ordering stops along a route        | `(routeId, stopId)` (btree)  |
| `fare`             | yes    | Route-level (terminus) fare for route cards    | `routeId` (pk)               |
| `route_fare`       | yes    | Per-stop fare to reach each stop from St. John's | `(routeId, stopId)` (btree) |
| `place`            | yes    | Beach / site / village destination, tied to its nearest stop | `id` (pk, autoInc), `nearestStopId` (idx) |
| `admin`            | yes    | Identities allowed to edit the network         | `identity` (pk)              |

### Why the tables are shaped this way

- **`route_stop` is a join table.** A route has many stops and a stop can belong
  to many routes, so the relationship is many-to-many. `sequence` gives the
  *order* stops are visited. A compound `(routeId, stopId)` index makes both the
  "list this route's stops" query and the duplicate guard efficient.
- **Fares are two levels.** `route_fare` stores the fare *to reach each stop*
  (the source data from busstopanu.com is a fare table per route). `fare` keeps a
  single route-level figure (the terminus fare) for the route cards. Both are in
  **cents** (`t.u16()`), so `EC$ 2.25` is stored as `225`.
- **`place` links tourist content to the network.** A beach or landmark isn't a
  bus stop, but riders still want to reach it, so each place points at its
  nearest stop (`nearestStopId`, `0` when unassigned). The planner accepts places
  and resolves them to that stop, so no routing logic had to change.
- **`admin` gates writes.** It holds the identities allowed to edit, and every
  mutating reducer checks it before touching data (see §4).

Schema notes:
- `id` columns use `t.u64()` with `.primaryKey().autoInc()`, inserting `0n` as a
  placeholder.
- `route.number` is a **string**, because route numbers are alphanumeric (`29B`,
  `40B`, `41B`).
- Coordinates are `t.f32()`.

---

## 4. Reducers

Reducers are the **only** way to write data. Each one is registered on the schema
and exported (the export name becomes the reducer name). CLI calls use the
**snake_case** name (`add_route`), while the client bindings are camelCase.

| Reducer           | Input                                              | Effect                                                              |
| ----------------- | -------------------------------------------------- | ------------------------------------------------------------------- |
| `addRoute`        | `number, name, terminus, color, description`       | Insert into `route`                                                 |
| `addStop`         | `name, lat, lng`                                   | Validate coordinates, insert into `bus_stop`                        |
| `addStopToRoute`  | `routeId, stopId, sequence`                        | Reject duplicates via the compound index, insert into `route_stop`  |
| `deleteRoute`     | `routeId`                                          | Cascade-delete the route's `route_stop`, `fare` and `route_fare` rows, then the `route` |
| `setFare`         | `routeId, adult, child, night`                     | Upsert the route-level `fare`                                       |
| `setRouteFare`    | `routeId, stopId, adult, child, night`             | Upsert the per-stop `route_fare`                                    |
| `addPlace`        | `name, category, lat, lng, description, nearestStopId` | Validate + insert a destination; `nearestStopId` must match a stop (or be 0) |
| `deletePlace`     | `placeId`                                          | Delete a destination                                                |
| `claimAdmin`      | _none_                                             | One-time bootstrap: first caller (while `admin` is empty) becomes the admin |

### Authorization (read-only public data)

The network is **read-only to the public**. Every mutating reducer
(`addRoute`, `addStop`, `addStopToRoute`, `deleteRoute`, `setFare`,
`setRouteFare`, `addPlace`, `deletePlace`) starts with `assertAdmin(ctx)`, which looks the
caller's `ctx.sender` up in the `admin` table and throws `SenderError` if it is
absent. Because enforcement lives inside the reducer, hiding the Admin UI is only
cosmetic — a crafted client still can't write.

`claimAdmin` is the bootstrap: it succeeds only while the `admin` table is empty,
so the first identity to call it (from the owner's browser, right after
publishing) becomes the admin. After that it is closed to everyone else.

```ts
type Ctx = ReducerCtx<InferSchema<typeof spacetimedb>>;

function assertAdmin(ctx: Ctx): void {
  if (!ctx.db.admin.identity.find(ctx.sender)) {
    throw new SenderError('Not authorized: only admins can edit the bus network');
  }
}
```

**Validation pattern** — reducer arguments are required, so validation means
checking values are sane, then throwing `SenderError` to abort the transaction:

```ts
if (!Number.isFinite(lat) || lat < -90 || lat > 90)
  throw new SenderError('lat must be between -90 and 90');
```

**Uniqueness pattern** — query the compound index, then insert only if empty:

```ts
const existing = [...ctx.db.route_stop.by_route_stop.filter([routeId, stopId])];
if (existing.length > 0) throw new SenderError('Stop is already on this route');
ctx.db.route_stop.insert({ id: 0n, routeId, stopId, sequence });
```

**Upsert pattern** (used by `setFare` / `setRouteFare` / `reportPosition`) — find
by key, `update` if present, otherwise `insert`.

### Seeding (`init`)

`spacetimedb.init` runs once when the module is published. It reads `STOPS` and
`ROUTES` from `seed.ts`, inserts each stop, then for each route inserts the route
row, its ordered `route_stop` rows, its per-stop `route_fare` rows, and a
route-level `fare` row (the terminus fare). Republishing with
`--delete-data=always` wipes and re-seeds from scratch.

---

## 5. The client

### Connection (`src/main.tsx`)

A `DbConnection` is built once and handed to `SpacetimeDBProvider`. The host and
database are resolved in `lib/config.ts`: runtime config injected by the container
(`window.__ENV__`) wins, then the build-time Vite env vars
(`VITE_SPACETIMEDB_HOST`, `VITE_SPACETIMEDB_DB_NAME`), then the maincloud
defaults. The auth token is cached in `localStorage` so the same identity is
reused across reloads — which is what lets an admin stay an admin.

### Page shell (`src/App.tsx`)

A single-page shell with tabs. It subscribes once to every table the UI needs:

```
useTable(tables.route)            useTable(tables.fare)
useTable(tables.busStop)          useTable(tables.routeFare)
useTable(tables.routeStop)        useTable(tables.admin)
useTable(tables.place)            // beaches / sites / villages
```

The rows are passed down to the views; the UI never waits on a return value.
`App` compares the current `identity` against the `admin` rows to decide whether
the Admin tab is shown, and uses the hook's `isReady` flag to show a loading
state until the initial subscription replay has landed.

### Views (`src/components/`)

- **`Header`** — black bar with a flag stripe and the tab nav.
- **`JourneyPlanner`** — searchable "I am here / going to" pickers that offer both
  bus stops *and* places (grouped by category); renders itinerary cards with
  per-leg and total fares. The chosen journey is remembered and reflected in the URL.
- **`ExploreView`** — destinations grouped by category (beaches, sites, villages),
  each showing its nearest stop and a "Plan a bus" button that deep-links into the
  planner.
- **`MapView`** — Leaflet map: blue stop markers, a coloured polyline per route,
  and category-coloured place markers, with layer toggles. Loaded lazily so Leaflet
  stays out of the initial bundle.
- **`RoutesView`** — route cards; expanding one lists its ordered stops with each
  stop's fare.
- **`StopsView`** — searchable stop list (coordinates hidden; "Location pending"
  tag for un-geocoded stops).
- **`WeatherCard`** — current weather for St. John's, fetched from Open-Meteo (no
  API key) in the browser.
- **`DataView`** — the public data page: JSON/CSV downloads, connection details,
  CLI/SQL examples and a table reference.
- **`AdminView`** — admin-only: add/delete routes, set route-level and per-stop
  fares, add stops to routes. Non-admins see an "admins only" notice; if no admin
  has been claimed yet, it offers the one-time claim.
- **`LegacyLinks`** — grid of links to the original busstopanu.com pages, all
  `target="_blank" rel="noopener noreferrer"`.
- **`AboutView`** / **`Footer`** — static info plus the legacy links.

### Journey planning & fares (`src/lib/journey.ts`)

- `buildRouteStopMap` / `stopsForRoute` — order a route's stops by `sequence`.
- `buildRouteFareMap` / `fareToStop` — index per-stop fares by `routeId:stopId`.
  St. John's is the $0 origin (it has no `route_fare` row).
- `segmentFare` — price one leg as the fare of whichever endpoint is **farther
  from the capital**: `max(fareTo(from), fareTo(to))`. You pay per bus boarded, for
  the distance covered while on it, so a stop on the way to St. John's never costs
  more than your boarding stop. Cedar Grove → Friars Hill Road (on the way in) is
  EC$2.50, not $0.
- `planJourney` — finds direct routes first, then one-transfer itineraries joined
  at a shared stop (which, since every route starts at St. John's, is usually
  St. John's itself). Totals are the **sum of the leg fares**.

### Theming (`src/index.css`)

Tailwind v4 with a heritage `@theme` palette drawn from the Antigua & Barbuda
flag: red `#d32630`, black `#000000`, blue `#407fc9`, white `#ffffff`, yellow
`#f4d840` — exposed as `brand-*` (blue), `sun-*` (yellow), `flag-*` (red), `ink`.

### Data flow in practice

```
User submits form
        │
        ▼
useReducer(reducers.addStop)({ name, lat, lng })   ← fire-and-forget
        │
        ▼
addStop runs inside SpacetimeDB, validates, inserts row
        │
        ▼
SpacetimeDB pushes the new row to every subscribed client
        │
        ▼
useTable(tables.busStop) re-renders with the new stop
```

### Client gotchas

- Rows from `useTable` are **readonly** — copy before sorting/mapping:
  `const sorted = [...rows].sort(...)`.
- `t.u64()`/`t.i64()` columns are **`bigint`**, which React can't render — wrap
  them: `{Number(row.id)}` or `{String(count)}`.
- Don't create a second subscription effect in parallel with `useTable`; let the
  hook own its subscriptions.

---

## 6. Public data access

The data is open. Every table can be read by anyone, and the app ships a **Data**
page (`DataView`) that packages it for reuse.

### In-app downloads

- **Everything (JSON)** — one self-describing snapshot: routes (with ordered stops
  and fares), stops with coordinates, places, source host/database, and
  generated-at date.
- **Routes / Stops / Route fares / Places (CSV)** — flat files for spreadsheets.

### Query the live database

The database is on SpacetimeDB Maincloud
(`wss://maincloud.spacetimedb.com`, database `bus-system-qcj1z`). Any SpacetimeDB
client can read it:

```bash
spacetime sql bus-system-qcj1z "SELECT number, name, terminus FROM route"
spacetime sql bus-system-qcj1z "SELECT name, lat, lng FROM bus_stop"
spacetime sql bus-system-qcj1z "SELECT * FROM route_fare"
```

or subscribe from the TypeScript SDK:

```ts
DbConnection.builder()
  .withUri('wss://maincloud.spacetimedb.com')
  .withDatabaseName('bus-system-qcj1z')
  .subscribe(['route', 'bus_stop', 'route_stop', 'fare', 'route_fare', 'place']);
```

Reads are unrestricted; writes are admin-only (§4), so the public can mirror the
data but never modify it. Coordinates are approximate for a handful of stops, and
`(0, 0)` marks a stop that hasn't been placed yet.

---

## 7. Milestone map

| Milestone | Theme                     | Status      | Deliverable                                              |
| --------- | ------------------------- | ----------- | -------------------------------------------------------- |
| M1        | Routes + stops            | **Done**    | CRUD skeleton + full network seeded (23 routes, 87 stops)|
| M1.5      | Fares                     | **Done**    | Route-level + per-stop fares, journey totals             |
| M2        | Vehicles + live positions | **Dropped** | Out of scope — the `vehicle` / `vehicle_position` tables and `reportPosition` reducer were removed |
| M3        | Simulated movement        | **Dropped** | Depended on M2                                           |
| M4        | Auth + roles              | **Partial** | Public data is read-only: admin allow-list + `assertAdmin` guards + `claimAdmin` landed. Driver-specific roles still TODO. |
| M5        | Real GPS ingestion        | Dropped     | Depended on vehicle tracking                             |
| M6        | ETA computation           | Pending     | Estimates would need schedule data                       |
| M7        | Destinations              | **Done**    | Beaches & sites with nearest-stop links, Explore page, map layer, planner integration |

### Known data gaps

- 4 stops have no coordinates yet (`Bathlodge`, `Blackout`, `Briggins`,
  `Carty's Hill`) and are hidden on the map.
- 7 stops are approximated, not survey-grade (`Clarkes Hill`, `Crabbe Hill`,
  `Free Trade Zone`, `Hattan`, `Horsford Hill`, `Longfords`, `Upper Fort Road`).
- The `admin` table starts empty, so the owner must call `claimAdmin` once (via the
  Admin tab in their browser) before anyone can edit. Until then the Admin tab
  offers the claim to whoever opens it first.

---

## 8. Debugging checklist

1. Is the SpacetimeDB server reachable? (`spacetime server ping maincloud`)
2. Is the module published? (`spacetime publish`)
3. Are client bindings regenerated after schema changes? (`npm run spacetime:generate`)
4. Check server logs for reducer errors: `spacetime logs <db-name>`
5. Is the reducer actually being called from the client?

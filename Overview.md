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
                  │   └────────────┘      │  route_fare, vehicle,    │    │
                  │                       │  vehicle_position        │    │
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
6. **Table `name`s must be snake_case** (`route_stop`, `vehicle_position`); the
   TypeScript identifiers stay camelCase.

---

## 2. Repository layout

```
bus-system/
├── spacetimedb/                    # The server-side module (runs inside SpacetimeDB)
│   └── src/
│       ├── index.ts                # Tables, reducers, lifecycle hooks, init seeding
│       └── seed.ts                 # STOPS (87) + ROUTES (23) seed data
├── src/                            # The React client
│   ├── main.tsx                    # Connection setup + SpacetimeDBProvider
│   ├── App.tsx                     # Page shell + useTable subscriptions
│   ├── index.css                   # Tailwind v4 + heritage @theme palette
│   ├── lib/
│   │   └── journey.ts              # Journey planning + fare helpers
│   ├── components/                 # Header, JourneyPlanner, MapView, RoutesView,
│   │                               #   StopsView, AdminView, AboutView, Footer
│   └── module_bindings/            # Auto-generated types mirroring the module
├── .env                            # VITE_SPACETIMEDB_HOST / _DB_NAME
├── spacetime.json                  # CLI project config (server, database, paths)
└── package.json                    # Dev/build/generate scripts
```

The `module_bindings/` directory is **generated**, not hand-written. After any
schema change in `spacetimedb/src/index.ts`, regenerate it so the client's
`tables.*` and `reducers.*` stay in sync:

```bash
npm run spacetime:generate
```

> Note: the CLI **skips private tables during codegen**, so `vehicle` (private)
> does not appear in the client bindings.

---

## 3. Data model

The schema is split by **access pattern**, not by entity. Transient, high-churn
data is kept in its own table so subscribers only re-render rows that actually
change. All network data is `public` so passengers can read it; writes still go
exclusively through reducers.

| Table              | Public | Purpose                                        | Key / Index                  |
| ------------------ | ------ | ---------------------------------------------- | ---------------------------- |
| `route`            | yes    | A bus line: number, name, terminus, color, description | `id` (pk, autoInc)     |
| `bus_stop`         | yes    | A physical stop with coordinates               | `id` (pk, autoInc)           |
| `route_stop`       | yes    | Join table ordering stops along a route        | `(routeId, stopId)` (btree)  |
| `fare`             | yes    | Route-level (terminus) fare for route cards    | `routeId` (pk)               |
| `route_fare`       | yes    | Per-stop fare to reach each stop from St. John's | `(routeId, stopId)` (btree) |
| `vehicle`          | no     | A bus: plate, assigned route                   | `id` (pk, autoInc), `routeId` (idx) |
| `vehicle_position` | yes    | Live lat/lng/heading of a vehicle (high churn) | `vehicleId` (pk)             |

### Why the tables are shaped this way

- **`route_stop` is a join table.** A route has many stops and a stop can belong
  to many routes, so the relationship is many-to-many. `sequence` gives the
  *order* stops are visited. A compound `(routeId, stopId)` index makes both the
  "list this route's stops" query and the duplicate guard efficient.
- **Fares are two levels.** `route_fare` stores the fare *to reach each stop*
  (the source data from busstopanu.com is a fare table per route). `fare` keeps a
  single route-level figure (the terminus fare) for the route cards. Both are in
  **cents** (`t.u16()`), so `EC$ 2.25` is stored as `225`.
- **Positions are isolated.** `vehicle_position` changes every few seconds while
  `route`/`bus_stop` almost never change. Mixing them would force clients to
  re-render slow tables on every GPS tick, so they live apart.
- **`vehicle` is private.** Plate/route assignment isn't exposed to clients yet;
  only the derived `vehicle_position` is public.

Schema notes:
- `id` columns use `t.u64()` with `.primaryKey().autoInc()`, inserting `0n` as a
  placeholder.
- `route.number` is a **string**, because route numbers are alphanumeric (`29B`,
  `40B`, `41B`).
- Coordinates are `t.f32()`; `updatedAt` is `t.timestamp()`.

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
| `reportPosition`  | `vehicleId, lat, lng, heading`                     | Upsert `vehicle_position`, stamp `updatedAt` with `ctx.timestamp`   |

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
database come from Vite env vars (`VITE_SPACETIMEDB_HOST`,
`VITE_SPACETIMEDB_DB_NAME`), with maincloud defaults as fallback. The auth token
is cached in `localStorage` so the same identity is reused across reloads.

### Page shell (`src/App.tsx`)

A single-page shell with tabs. It subscribes once to every table the UI needs:

```
useTable(tables.route)            useTable(tables.fare)
useTable(tables.busStop)          useTable(tables.routeFare)
useTable(tables.routeStop)        useTable(tables.vehiclePosition)
```

The rows are passed down to the views; the UI never waits on a return value.

### Views (`src/components/`)

- **`Header`** — black bar with a flag stripe and the tab nav.
- **`JourneyPlanner`** — "I am here / going to" selects; renders itinerary cards
  with per-leg and total fares.
- **`MapView`** — Leaflet map: blue stop markers, a colored polyline per route,
  and red bus markers rotated by heading, with layer toggles.
- **`RoutesView`** — route cards; expanding one lists its ordered stops with each
  stop's fare.
- **`StopsView`** — searchable stop list (coordinates hidden; "Location pending"
  tag for un-geocoded stops).
- **`AdminView`** — add/delete routes, set route-level and per-stop fares, add
  stops to routes.
- **`AboutView`** / **`Footer`** — static info.

### Journey planning & fares (`src/lib/journey.ts`)

- `buildRouteStopMap` / `stopsForRoute` — order a route's stops by `sequence`.
- `buildRouteFareMap` / `fareToStop` — index per-stop fares by `routeId:stopId`.
  St. John's is the $0 origin (it has no `route_fare` row).
- `segmentFare` — price one leg as the **difference from the capital**:
  `|fareTo(to) − fareTo(from)|`. So St. John's → Horsford Hill is the full $3.00,
  while Belmont → Horsford Hill is $0.75.
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

## 6. Milestone map

| Milestone | Theme                     | Status      | Deliverable                                              |
| --------- | ------------------------- | ----------- | -------------------------------------------------------- |
| M1        | Routes + stops            | **Done**    | CRUD skeleton + full network seeded (23 routes, 87 stops)|
| M1.5      | Fares                     | **Done**    | Route-level + per-stop fares, journey totals             |
| M2        | Vehicles + live positions | **Partial** | `vehicle` + `vehicle_position` + `reportPosition` exist; `createVehicle` / `assignVehicleToRoute` still TODO |
| M3        | Simulated movement        | Pending     | Scheduled `tick`; positions animate on the map           |
| M4        | Auth + roles              | Pending     | Driver controls scoped to `ctx.sender`; riders read-only |
| M5        | Real GPS ingestion        | Pending     | Procedure + `ctx.withTx`                                 |
| M6        | ETA computation           | Pending     | Estimates derived from tick/schedule data                |

### Known data gaps

- 4 stops have no coordinates yet (`Bathlodge`, `Blackout`, `Briggins`,
  `Carty's Hill`) and are hidden on the map.
- 7 stops are approximated, not survey-grade (`Clarkes Hill`, `Crabbe Hill`,
  `Free Trade Zone`, `Hattan`, `Horsford Hill`, `Longfords`, `Upper Fort Road`).
- Admin actions are open to any connected client until M4 lands.

---

## 7. Debugging checklist

1. Is the SpacetimeDB server reachable? (`spacetime server ping maincloud`)
2. Is the module published? (`spacetime publish`)
3. Are client bindings regenerated after schema changes? (`npm run spacetime:generate`)
4. Check server logs for reducer errors: `spacetime logs <db-name>`
5. Is the reducer actually being called from the client?

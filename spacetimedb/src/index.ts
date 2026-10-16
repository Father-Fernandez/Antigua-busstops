import { schema, table, t, SenderError } from 'spacetimedb/server';
import { STOPS, ROUTES } from './seed';

// ============================================================================
// BUS SYSTEM — BACKEND ROADMAP  (work top to bottom, one checkbox at a time)
// ============================================================================
//
// Milestone 1 - Routes + stops (the CRUD skeleton; proves table->reducer->UI)
//   [ ] Add `route` table
//   [ ] Add `stop` table
//   [ ] Add `route_stop` join table (orders stops along a route)
//   [ ] Add reducers: createRoute, addStop, addStopToRoute
//   [ ] Subscribe + render them in src/App.tsx (client roadmap is there)
//
// Milestone 2 - Vehicles + live positions (the real-time showcase)
//   [ ] Add `vehicle` table (plate, routeId, status)
//   [ ] Add `vehicle_position` table (lat, lng, heading, updatedAt)
//       -> HIGH CHURN: keep it isolated from slow-changing tables so that
//          subscribers only re-render the rows that actually move
//   [ ] Add reducers: createVehicle, assignVehicleToRoute, reportPosition
//
// Milestone 3 - Simulate movement (no GPS hardware needed yet)
//   [ ] Add a scheduled table + `tick` reducer that advances each vehicle
//       along its route_stop sequence every few seconds
//   [ ] Watch positions update live on the passenger map
//   (Template: search AGENTS.md for "Scheduled Tables")
//
// Milestone 4 - Auth + roles
//   [ ] Driver registers/controls a vehicle via ctx.sender; riders are read-only
//   [ ] Never trust an identity passed as a reducer argument (see AGENTS.md)
//
// Milestone 5 - Real GPS ingestion  (procedure + ctx.withTx)
//
// Milestone 6 - ETA computation  (from the tick/schedule data)
//
// ----------------------------------------------------------------------------
// Schema sketch — rename/add columns as you go. Table `name` MUST be snake_case.
//
//   route               stop                route_stop          vehicle
//   id (pk, autoInc)    id (pk, autoInc)    route_id (idx)      id (pk, autoInc)
//   name                name                stop_id             plate
//   color               lat                 sequence            route_id (idx)
//   description         lng                                     status
//
//   vehicle_position  (public, high churn)
//   vehicle_id (pk, idx)   lat   lng   heading   updated_at (t.timestamp())
//
// Remember: reducers mutate state and return nothing — the client learns about
// results by subscribing to the tables you write to here.
// ============================================================================

// TODO(M1): the template demo tables below get deleted once `route`/`stop` exist.
const spacetimedb = schema({
  route: table(
    { public: true }, {
      id: t.u64().primaryKey().autoInc(),
      number: t.string(),
      name: t.string(),
      terminus: t.string(),
      color: t.string(),
      description: t.string(),
    }
  ),
  bus_stop: table(
    { public: true }, {
      id: t.u64().primaryKey().autoInc(),
      name: t.string(),
      lat: t.f32(),
      lng: t.f32(),
    }
  ),
  route_stop: table(
    {
      public: true,
      indexes: [
        { accessor: 'by_route_stop', algorithm: 'btree', columns: ['routeId', 'stopId'] },
      ],
    }, {
      id: t.u64().primaryKey().autoInc(),
      routeId: t.u64(),
      stopId: t.u64(),
      sequence: t.u32(),
    }
  ),
  vehicle: table(
    { public: false }, {
      id: t.u64().primaryKey().autoInc(),
      plate: t.string(),
      routeId: t.u64().index(),
    }
  ),
  vehicle_position: table(
    {public: true }, {
      vehicleId: t.u64().primaryKey(),
      lat: t.f32(),
      lng: t.f32(),
      heading: t.f32(),
      updatedAt: t.timestamp(),
    }
  ),
  fare: table(
    { public: true }, {
      routeId: t.u64().primaryKey(),
      adult: t.u16(),
      child: t.u16(),
      night: t.u16(),
    }
  ),
  route_fare: table(
    {
      public: true,
      indexes: [
        { accessor: 'by_route_stop', algorithm: 'btree', columns: ['routeId', 'stopId'] },
      ],
    }, {
      id: t.u64().primaryKey().autoInc(),
      routeId: t.u64(),
      stopId: t.u64(),
      adult: t.u16(),
      child: t.u16(),
      night: t.u16(),
    }
  )
});
export default spacetimedb;


export const init = spacetimedb.init(ctx => {
  // Called when the module is initially published.
  // Seed the known Antigua stops so the network has data from day one.
  const stopIdByName = new Map<string, bigint>();
  for (const stop of STOPS) {
    const row = ctx.db.bus_stop.insert({ id: 0n, name: stop.name, lat: stop.lat, lng: stop.lng });
    stopIdByName.set(stop.name, row.id);
  }

  for (const route of ROUTES) {
    const row = ctx.db.route.insert({
      id: 0n,
      number: route.number,
      name: route.name,
      terminus: route.terminus,
      color: route.color,
      description: route.description,
    });

    let sequence = 1;
    for (const stopName of route.stops) {
      const stopId = stopIdByName.get(stopName);
      if (stopId === undefined) continue;
      ctx.db.route_stop.insert({ id: 0n, routeId: row.id, stopId, sequence: sequence++ });
    }

    let terminusFare: { adult: number; child: number; night: number } | undefined;
    for (const sf of route.stopFares ?? []) {
      const stopId = stopIdByName.get(sf.stop);
      if (stopId === undefined) continue;
      ctx.db.route_fare.insert({
        id: 0n,
        routeId: row.id,
        stopId,
        adult: sf.adult,
        child: sf.child,
        night: sf.night,
      });
      terminusFare = { adult: sf.adult, child: sf.child, night: sf.night };
    }

    if (terminusFare) {
      ctx.db.fare.insert({
        routeId: row.id,
        adult: terminusFare.adult,
        child: terminusFare.child,
        night: terminusFare.night,
      });
    }
  }
});

export const onConnect = spacetimedb.clientConnected(_ctx => {
  // Called every time a new client connects
});

export const onDisconnect = spacetimedb.clientDisconnected(_ctx => {
  // Called every time a client disconnects
});

export const addRoute = spacetimedb.reducer(
  {
    number: t.string(),
    name: t.string(),
    terminus: t.string(),
    color: t.string(),
    description: t.string(),
  },
  (ctx, { number, name, terminus, color, description }) => {
    ctx.db.route.insert({ id: 0n, number, name, terminus, color, description });
  }
);

export const addStop = spacetimedb.reducer(
  { name: t.string(), lat: t.f32(), lng: t.f32() },
  (ctx, { name, lat, lng }) => {
    if (!Number.isFinite(lat) || lat < -90 || lat > 90)
      throw new SenderError('lat must be between -90 and 90');
    if (!Number.isFinite(lng) || lng < -180 || lng > 180)
      throw new SenderError('lng must be between -180 and 180');

    ctx.db.bus_stop.insert({ id: 0n, name, lat, lng })
  }
);

export const addStopToRoute = spacetimedb.reducer(
  { routeId: t.u64(), stopId: t.u64(), sequence: t.u32() },
  (ctx, { routeId, stopId, sequence }) => {
    const existing = [...ctx.db.route_stop.by_route_stop.filter([routeId, stopId])];
    if (existing.length > 0)
      throw new SenderError('Stop is already on this route');

    ctx.db.route_stop.insert({ id: 0n, routeId, stopId, sequence });
  }
);

export const deleteRoute = spacetimedb.reducer(
  { routeId: t.u64() },
  (ctx, { routeId }) => {
    const route = ctx.db.route.id.find(routeId);
    if (!route) throw new SenderError('Route not found');

    // Cascade: drop the route's stop assignments and fare before the route row.
    for (const rs of [...ctx.db.route_stop.by_route_stop.filter(routeId)]) {
      ctx.db.route_stop.id.delete(rs.id);
    }

    const fare = ctx.db.fare.routeId.find(routeId);
    if (fare) ctx.db.fare.routeId.delete(routeId);

    for (const rf of [...ctx.db.route_fare.by_route_stop.filter(routeId)]) {
      ctx.db.route_fare.id.delete(rf.id);
    }

    ctx.db.route.id.delete(routeId);
  }
);

export const setFare = spacetimedb.reducer(
  { routeId: t.u64(), adult: t.u16(), child: t.u16(), night: t.u16() },
  (ctx, { routeId, adult, child, night }) => {
    const existing = ctx.db.fare.routeId.find(routeId);
    if (existing) {
      ctx.db.fare.routeId.update({ routeId, adult, child, night });
    } else {
      ctx.db.fare.insert({ routeId, adult, child, night });
    }
  }
);

export const setRouteFare = spacetimedb.reducer(
  { routeId: t.u64(), stopId: t.u64(), adult: t.u16(), child: t.u16(), night: t.u16() },
  (ctx, { routeId, stopId, adult, child, night }) => {
    const existing = [...ctx.db.route_fare.by_route_stop.filter([routeId, stopId])][0];
    if (existing) {
      ctx.db.route_fare.id.update({ ...existing, adult, child, night });
    } else {
      ctx.db.route_fare.insert({ id: 0n, routeId, stopId, adult, child, night });
    }
  }
);

export const reportPosition = spacetimedb.reducer(
  { vehicleId: t.u64(), lat: t.f32(), lng: t.f32(), heading: t.f32() },
  (ctx, { vehicleId, lat, lng, heading }) => {
    const updatedAt = ctx.timestamp;
    const existing = ctx.db.vehicle_position.vehicleId.find(vehicleId);

    if (existing) {
      ctx.db.vehicle_position.vehicleId.update({
        ...existing,
        lat,
        lng,
        heading,
        updatedAt,
      });
    } else {
      ctx.db.vehicle_position.insert({
        vehicleId,
        lat,
        lng,
        heading,
        updatedAt,
      });
    }
  }
);
//
// TODO(M3): scheduled tick reducer
//   -> moves each active vehicle one step along its route. Look up the
//      "Scheduled Tables" section in AGENTS.md for the exact wiring.

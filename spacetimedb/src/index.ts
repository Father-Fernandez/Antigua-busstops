import { t, SenderError, type InferSchema, type ReducerCtx } from 'spacetimedb/server';
import spacetimedb from './schema';
import { STOPS, ROUTES, PLACES } from './seed';

// This file is the module entry point; the tables live in ./schema.ts.
export { default } from './schema';

type Ctx = ReducerCtx<InferSchema<typeof spacetimedb>>;

/**
 * The bus network is read-only to the public. Every mutating reducer calls this
 * so only identities listed in the `admin` table can add, change or delete data.
 */
function assertAdmin(ctx: Ctx): void {
  if (!ctx.db.admin.identity.find(ctx.sender)) {
    throw new SenderError('Not authorized: only admins can edit the bus network');
  }
}

export const init = spacetimedb.init(ctx => {
  // Called once when the module is first published. Seed the known Antigua
  // network so the app has data from day one.
  const stopIdByName = new Map<string, bigint>();
  for (const stop of STOPS) {
    const row = ctx.db.busStop.insert({ id: 0n, name: stop.name, lat: stop.lat, lng: stop.lng });
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
      ctx.db.routeStop.insert({ id: 0n, routeId: row.id, stopId, sequence: sequence++ });
    }

    let terminusFare: { adult: number; child: number; night: number } | undefined;
    for (const sf of route.stopFares ?? []) {
      const stopId = stopIdByName.get(sf.stop);
      if (stopId === undefined) continue;
      ctx.db.routeFare.insert({
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

  // Tourist destinations, each resolved to its nearest seeded stop.
  for (const place of PLACES) {
    const nearestStopId = place.nearestStop
      ? (stopIdByName.get(place.nearestStop) ?? 0n)
      : 0n;
    ctx.db.place.insert({
      id: 0n,
      name: place.name,
      category: place.category,
      lat: place.lat,
      lng: place.lng,
      description: place.description,
      nearestStopId,
    });
  }
});

/**
 * One-time bootstrap: the first identity to call this becomes the admin, after
 * which the door closes for everyone else. Run it once from the owner's browser
 * right after publishing.
 */
export const claimAdmin = spacetimedb.reducer(ctx => {
  if ([...ctx.db.admin.iter()].length > 0) {
    throw new SenderError('An admin has already been claimed for this database');
  }
  ctx.db.admin.insert({ identity: ctx.sender });
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
    assertAdmin(ctx);
    ctx.db.route.insert({ id: 0n, number, name, terminus, color, description });
  }
);

export const addStop = spacetimedb.reducer(
  { name: t.string(), lat: t.f32(), lng: t.f32() },
  (ctx, { name, lat, lng }) => {
    assertAdmin(ctx);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90)
      throw new SenderError('lat must be between -90 and 90');
    if (!Number.isFinite(lng) || lng < -180 || lng > 180)
      throw new SenderError('lng must be between -180 and 180');

    ctx.db.busStop.insert({ id: 0n, name, lat, lng });
  }
);

export const addStopToRoute = spacetimedb.reducer(
  { routeId: t.u64(), stopId: t.u64(), sequence: t.u32() },
  (ctx, { routeId, stopId, sequence }) => {
    assertAdmin(ctx);
    const existing = [...ctx.db.routeStop.by_route_stop.filter([routeId, stopId])];
    if (existing.length > 0)
      throw new SenderError('Stop is already on this route');

    ctx.db.routeStop.insert({ id: 0n, routeId, stopId, sequence });
  }
);

export const deleteRoute = spacetimedb.reducer(
  { routeId: t.u64() },
  (ctx, { routeId }) => {
    assertAdmin(ctx);
    const route = ctx.db.route.id.find(routeId);
    if (!route) throw new SenderError('Route not found');

    // Cascade: drop the route's stop assignments and fares before the route row.
    for (const rs of [...ctx.db.routeStop.by_route_stop.filter(routeId)]) {
      ctx.db.routeStop.id.delete(rs.id);
    }

    const fare = ctx.db.fare.routeId.find(routeId);
    if (fare) ctx.db.fare.routeId.delete(routeId);

    for (const rf of [...ctx.db.routeFare.by_route_stop.filter(routeId)]) {
      ctx.db.routeFare.id.delete(rf.id);
    }

    ctx.db.route.id.delete(routeId);
  }
);

export const setFare = spacetimedb.reducer(
  { routeId: t.u64(), adult: t.u16(), child: t.u16(), night: t.u16() },
  (ctx, { routeId, adult, child, night }) => {
    assertAdmin(ctx);
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
    assertAdmin(ctx);
    const existing = [...ctx.db.routeFare.by_route_stop.filter([routeId, stopId])][0];
    if (existing) {
      ctx.db.routeFare.id.update({ ...existing, adult, child, night });
    } else {
      ctx.db.routeFare.insert({ id: 0n, routeId, stopId, adult, child, night });
    }
  }
);

export const addPlace = spacetimedb.reducer(
  {
    name: t.string(),
    category: t.string(),
    lat: t.f32(),
    lng: t.f32(),
    description: t.string(),
    nearestStopId: t.u64(),
  },
  (ctx, { name, category, lat, lng, description, nearestStopId }) => {
    assertAdmin(ctx);
    if (!name.trim()) throw new SenderError('name is required');
    if (!Number.isFinite(lat) || lat < -90 || lat > 90)
      throw new SenderError('lat must be between -90 and 90');
    if (!Number.isFinite(lng) || lng < -180 || lng > 180)
      throw new SenderError('lng must be between -180 and 180');
    if (nearestStopId !== 0n && !ctx.db.busStop.id.find(nearestStopId))
      throw new SenderError('nearestStopId does not match a known stop');

    ctx.db.place.insert({ id: 0n, name, category, lat, lng, description, nearestStopId });
  }
);

export const deletePlace = spacetimedb.reducer(
  { placeId: t.u64() },
  (ctx, { placeId }) => {
    assertAdmin(ctx);
    if (!ctx.db.place.id.find(placeId)) throw new SenderError('Place not found');
    ctx.db.place.id.delete(placeId);
  }
);



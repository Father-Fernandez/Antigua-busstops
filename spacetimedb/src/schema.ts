import { schema, table, t } from 'spacetimedb/server';

// Table keys are camelCase (so `ctx.db.busStop`); the explicit `name` keeps the
// canonical snake_case database name (`bus_stop`) that clients and SQL use.
const spacetimedb = schema({
  // Identities allowed to mutate the network. Public so the client can hide the
  // admin tools from everyone else; writing still goes through guarded reducers.
  admin: table(
    { public: true }, {
      identity: t.identity().primaryKey(),
    }
  ),
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
  busStop: table(
    { name: 'bus_stop', public: true }, {
      id: t.u64().primaryKey().autoInc(),
      name: t.string(),
      lat: t.f32(),
      lng: t.f32(),
    }
  ),
  routeStop: table(
    {
      name: 'route_stop',
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
  fare: table(
    { public: true }, {
      routeId: t.u64().primaryKey(),
      adult: t.u16(),
      child: t.u16(),
      night: t.u16(),
    }
  ),
  routeFare: table(
    {
      name: 'route_fare',
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
  ),
});

export default spacetimedb;

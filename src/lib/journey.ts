import type { BusStop, Fare, Route, RouteFare, RouteStop } from '../module_bindings/types';

export const CURRENCY = 'EC$';

export function formatFare(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '—';
  return `${CURRENCY} ${(cents / 100).toFixed(2)}`;
}

/** Max itineraries returned from a single journey search. */
export const MAX_ITINERARIES = 8;

/** Index stops by id. */
export function buildStopMap(stops: readonly BusStop[]): Map<string, BusStop> {
  const map = new Map<string, BusStop>();
  for (const s of stops) map.set(String(s.id), s);
  return map;
}

/** Index the route-level fare by routeId. */
export function buildFareByRouteMap(fares: readonly Fare[]): Map<string, Fare> {
  const map = new Map<string, Fare>();
  for (const f of fares) map.set(String(f.routeId), f);
  return map;
}

/** Routes sorted by number, numeric-aware (so "9" < "10" < "29B"). */
export function sortRoutesByNumber(routes: readonly Route[]): Route[] {
  return [...routes].sort((a, b) =>
    a.number.localeCompare(b.number, undefined, { numeric: true })
  );
}

/** A stop is mappable only once it has real coordinates (0,0 means pending). */
export function hasCoordinates(stop: BusStop): boolean {
  return !(stop.lat === 0 && stop.lng === 0);
}

export interface RouteWithStops {
  route: Route;
  stops: BusStop[];
  fare: Fare | null;
}

export interface FareAmount {
  adult: number;
  child: number;
  night: number;
}

function fareKey(routeId: string, stopId: string): string {
  return `${routeId}:${stopId}`;
}

/** Index per-stop fares by `routeId:stopId`. */
export function buildRouteFareMap(routeFares: readonly RouteFare[]): Map<string, FareAmount> {
  const map = new Map<string, FareAmount>();
  for (const rf of routeFares) {
    map.set(fareKey(String(rf.routeId), String(rf.stopId)), {
      adult: rf.adult,
      child: rf.child,
      night: rf.night,
    });
  }
  return map;
}

/** Fare to reach `stopId` from St. John's on a route. St. John's itself is the 0 origin. */
export function fareToStop(
  routeId: string,
  stopId: string,
  map: Map<string, FareAmount>
): FareAmount {
  return map.get(fareKey(routeId, stopId)) ?? { adult: 0, child: 0, night: 0 };
}

/**
 * Fare to ride one bus between two stops on the same route. You pay when you
 * board, for the whole distance you cover on that bus, so the fare is that of
 * whichever endpoint is farther from St. John's (the capital). A stop on the
 * way to the capital therefore costs no more than your boarding stop.
 */
export function segmentFare(
  routeId: string,
  fromStopId: string,
  toStopId: string,
  map: Map<string, FareAmount>
): FareAmount {
  const from = fareToStop(routeId, fromStopId, map);
  const to = fareToStop(routeId, toStopId, map);
  return {
    adult: Math.max(from.adult, to.adult),
    child: Math.max(from.child, to.child),
    night: Math.max(from.night, to.night),
  };
}

/** Route id -> its stops, ordered by `sequence`. */
export function buildRouteStopMap(
  routeStops: readonly RouteStop[]
): Map<string, RouteStop[]> {
  const map = new Map<string, RouteStop[]>();
  for (const rs of routeStops) {
    const key = String(rs.routeId);
    const list = map.get(key);
    if (list) list.push(rs);
    else map.set(key, [rs]);
  }
  for (const list of map.values()) list.sort((a, b) => a.sequence - b.sequence);
  return map;
}

export function stopsForRoute(
  routeId: bigint,
  routeStopsByRoute: Map<string, RouteStop[]>,
  stopById: Map<string, BusStop>
): BusStop[] {
  const rows = routeStopsByRoute.get(String(routeId)) ?? [];
  return rows
    .map(rs => stopById.get(String(rs.stopId)))
    .filter((s): s is BusStop => s !== undefined);
}

export interface ItineraryLeg {
  route: Route;
  from: BusStop;
  to: BusStop;
  fare: FareAmount;
}

export interface Itinerary {
  kind: 'direct' | 'transfer';
  legs: ItineraryLeg[];
  transferStop?: BusStop;
  adult: number;
  child: number;
  night: number;
}

/**
 * Plans trips from `originId` to `destId`:
 * direct routes first, then one-transfer connections. Routes are treated as
 * bidirectional (buses run both directions along a route). You pay per bus you
 * board, so each leg is priced at the fare of its farthest point from St. John's
 * and the totals are the sum of the legs.
 */
export function planJourney(
  originId: bigint,
  destId: bigint,
  routes: readonly Route[],
  routeStops: readonly RouteStop[],
  stopById: Map<string, BusStop>,
  routeFareMap: Map<string, FareAmount>
): Itinerary[] {
  if (originId === destId) return [];

  const byRoute = buildRouteStopMap(routeStops);
  const seqByRoute = new Map<string, bigint[]>();
  for (const [key, rows] of byRoute) seqByRoute.set(key, rows.map(r => r.stopId));

  const origin = stopById.get(String(originId));
  const dest = stopById.get(String(destId));
  if (!origin || !dest) return [];

  const direct: Itinerary[] = [];
  const transfers: Itinerary[] = [];

  const routesWithOrigin = new Set<string>();
  const routesWithDest = new Set<string>();

  for (const route of routes) {
    const key = String(route.id);
    const seq = seqByRoute.get(key) ?? [];
    const oi = seq.findIndex(id => id === originId);
    const di = seq.findIndex(id => id === destId);
    if (oi >= 0) routesWithOrigin.add(key);
    if (di >= 0) routesWithDest.add(key);

    if (oi >= 0 && di >= 0 && oi !== di) {
      const fare = segmentFare(key, String(originId), String(destId), routeFareMap);
      const leg: ItineraryLeg = { route, from: origin, to: dest, fare };
      direct.push({
        kind: 'direct',
        legs: [leg],
        adult: fare.adult,
        child: fare.child,
        night: fare.night,
      });
    }
  }

  // One-transfer itineraries: a route containing origin + a route containing
  // dest, joined at a shared stop.
  for (const aKey of routesWithOrigin) {
    const aSeq = seqByRoute.get(aKey) ?? [];
    for (const bKey of routesWithDest) {
      if (aKey === bKey) continue;
      const bSeq = seqByRoute.get(bKey) ?? [];
      const shared = aSeq.find(id => bSeq.includes(id));
      if (shared === undefined) continue;
      if (shared === originId || shared === destId) continue;

      const routeA = routes.find(r => String(r.id) === aKey);
      const routeB = routes.find(r => String(r.id) === bKey);
      const transferStop = stopById.get(String(shared));
      if (!routeA || !routeB || !transferStop) continue;

      const fareA = segmentFare(aKey, String(originId), String(shared), routeFareMap);
      const fareB = segmentFare(bKey, String(shared), String(destId), routeFareMap);
      const legA: ItineraryLeg = { route: routeA, from: origin, to: transferStop, fare: fareA };
      const legB: ItineraryLeg = { route: routeB, from: transferStop, to: dest, fare: fareB };
      transfers.push({
        kind: 'transfer',
        legs: [legA, legB],
        transferStop,
        adult: fareA.adult + fareB.adult,
        child: fareA.child + fareB.child,
        night: fareA.night + fareB.night,
      });
    }
  }

  return [...direct, ...transfers].slice(0, MAX_ITINERARIES);
}

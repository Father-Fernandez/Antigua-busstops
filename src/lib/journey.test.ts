import { describe, expect, it } from 'vitest';
import type { BusStop, Fare, Route, RouteFare, RouteStop } from '../module_bindings/types';
import {
  buildFareByRouteMap,
  buildRouteFareMap,
  buildRouteStopMap,
  buildStopMap,
  fareToStop,
  formatFare,
  hasCoordinates,
  MAX_ITINERARIES,
  planJourney,
  segmentFare,
  sortRoutesByNumber,
  stopsForRoute,
} from './journey';

function stop(id: number, name: string): BusStop {
  return { id: BigInt(id), name, lat: 17 + id / 100, lng: -61 - id / 100 };
}

function route(id: number, number: string): Route {
  return {
    id: BigInt(id),
    number,
    name: `Route ${number}`,
    terminus: 'East',
    color: '#407fc9',
    description: '',
  };
}

function routeStop(routeId: number, stopId: number, sequence: number): RouteStop {
  return {
    id: BigInt(sequence),
    routeId: BigInt(routeId),
    stopId: BigInt(stopId),
    sequence,
  };
}

function stopFare(
  routeId: number,
  stopId: number,
  adult: number,
  child = adult,
  night = adult
): RouteFare {
  return {
    id: BigInt(stopId),
    routeId: BigInt(routeId),
    stopId: BigInt(stopId),
    adult,
    child,
    night,
  };
}

function routeFare(routeId: number, adult: number, child = adult, night = adult): Fare {
  return { routeId: BigInt(routeId), adult, child, night };
}

// St. John's (1) is the hub; 2 and 3 are outlying stops; 5 is a junction.
const STOPS = [stop(1, "St. Johns"), stop(2, 'Pigotts'), stop(3, 'Hodges Bay'), stop(5, 'Junction')];
const STOP_MAP = buildStopMap(STOPS);

// Route 10: St. Johns -> Pigotts (direct to dest).
// Route 55: St. Johns -> Hodges Bay.
// Route 100: St. Johns -> Junction.  Route 200: Junction -> Pigotts (transfer).
const ROUTES = [route(10, '10'), route(55, '55'), route(100, '100'), route(200, '200')];
const ROUTE_STOPS = [
  routeStop(10, 1, 1),
  routeStop(10, 2, 2),
  routeStop(55, 1, 1),
  routeStop(55, 3, 2),
  routeStop(100, 1, 1),
  routeStop(100, 5, 2),
  routeStop(200, 5, 1),
  routeStop(200, 2, 2),
];
const ROUTE_FARES = [stopFare(10, 2, 250), stopFare(55, 3, 250), stopFare(100, 5, 200), stopFare(200, 2, 300)];
const ROUTE_FARE_MAP = buildRouteFareMap(ROUTE_FARES);

describe('formatFare', () => {
  it('renders cents as EC dollars', () => {
    expect(formatFare(250)).toBe('EC$ 2.50');
    expect(formatFare(0)).toBe('EC$ 0.00');
  });

  it('renders a dash for missing values', () => {
    expect(formatFare(null)).toBe('—');
    expect(formatFare(undefined)).toBe('—');
  });
});

describe('sortRoutesByNumber', () => {
  it('orders route numbers numerically', () => {
    const sorted = sortRoutesByNumber([route(1, '29B'), route(2, '10'), route(3, '9')]);
    expect(sorted.map(r => r.number)).toEqual(['9', '10', '29B']);
  });
});

describe('hasCoordinates', () => {
  it('treats (0,0) as pending', () => {
    expect(hasCoordinates({ id: 1n, name: 'x', lat: 0, lng: 0 })).toBe(false);
    expect(hasCoordinates({ id: 1n, name: 'x', lat: 17.1, lng: -61.8 })).toBe(true);
  });
});

describe('buildRouteStopMap / stopsForRoute', () => {
  it('orders route stops by sequence', () => {
    const map = buildRouteStopMap([routeStop(10, 2, 2), routeStop(10, 1, 1)]);
    const stops = stopsForRoute(10n, map, STOP_MAP);
    expect(stops.map(s => s.name)).toEqual(["St. Johns", 'Pigotts']);
  });
});

describe('buildFareByRouteMap', () => {
  it('indexes the route-level fare by route id', () => {
    const map = buildFareByRouteMap([routeFare(10, 250)]);
    expect(map.get('10')?.adult).toBe(250);
  });
});

describe('segmentFare', () => {
  it('charges the farther endpoint from St. Johns', () => {
    // Pigotts (250) is farther than St. Johns (0).
    expect(segmentFare('10', '1', '2', ROUTE_FARE_MAP).adult).toBe(250);
    expect(segmentFare('10', '2', '1', ROUTE_FARE_MAP).adult).toBe(250);
  });

  it('is symmetric and takes the max of both endpoints', () => {
    const map = new Map([
      ['x:1', { adult: 100, child: 50, night: 150 }],
      ['x:2', { adult: 300, child: 200, night: 400 }],
    ]);
    expect(segmentFare('x', '1', '2', map)).toEqual({ adult: 300, child: 200, night: 400 });
  });

  it('returns zero when no fare is published', () => {
    expect(fareToStop('10', '999', ROUTE_FARE_MAP)).toEqual({ adult: 0, child: 0, night: 0 });
  });
});

describe('planJourney', () => {
  it('returns [] when origin and destination are the same', () => {
    expect(planJourney(1n, 1n, ROUTES, ROUTE_STOPS, STOP_MAP, ROUTE_FARE_MAP)).toEqual([]);
  });

  it('returns [] for unknown stops', () => {
    expect(planJourney(1n, 999n, ROUTES, ROUTE_STOPS, STOP_MAP, ROUTE_FARE_MAP)).toEqual([]);
  });

  it('finds a direct route with its fare', () => {
    const results = planJourney(1n, 2n, ROUTES, ROUTE_STOPS, STOP_MAP, ROUTE_FARE_MAP);
    const direct = results.find(r => r.kind === 'direct');
    expect(direct).toBeDefined();
    expect(direct?.adult).toBe(250);
    expect(direct?.legs).toHaveLength(1);
  });

  it('plans a one-transfer itinerary joined at a shared stop', () => {
    const results = planJourney(1n, 2n, ROUTES, ROUTE_STOPS, STOP_MAP, ROUTE_FARE_MAP);
    const transfer = results.find(
      r => r.kind === 'transfer' && r.legs[0].route.number === '100'
    );
    expect(transfer).toBeDefined();
    expect(transfer?.transferStop?.name).toBe('Junction');
    // 200 (St. Johns -> Junction) + 300 (Junction -> Pigotts)
    expect(transfer?.adult).toBe(500);
  });

  it('treats routes as bidirectional (reverse direction still direct)', () => {
    const results = planJourney(2n, 1n, ROUTES, ROUTE_STOPS, STOP_MAP, ROUTE_FARE_MAP);
    expect(results.some(r => r.kind === 'direct' && r.adult === 250)).toBe(true);
  });

  it('never exceeds MAX_ITINERARIES results', () => {
    const results = planJourney(1n, 3n, ROUTES, ROUTE_STOPS, STOP_MAP, ROUTE_FARE_MAP);
    expect(results.length).toBeLessThanOrEqual(MAX_ITINERARIES);
  });
});

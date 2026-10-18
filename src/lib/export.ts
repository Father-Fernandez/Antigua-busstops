import type { BusStop, Fare, Route, RouteFare, RouteStop } from '../module_bindings/types';
import {
  buildFareByRouteMap,
  buildRouteFareMap,
  buildRouteStopMap,
  buildStopMap,
  fareToStop,
  hasCoordinates,
  sortRoutesByNumber,
  stopsForRoute,
} from './journey';

export interface ExportRouteStop {
  sequence: number;
  name: string;
  fareToHere: number;
}

export interface ExportRoute {
  id: number;
  number: string;
  name: string;
  terminus: string;
  color: string;
  description: string;
  fare: { adult: number; child: number; night: number } | null;
  stops: ExportRouteStop[];
}

export interface ExportStop {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  hasCoordinates: boolean;
}

export interface ExportDataset {
  generatedAt: string;
  source: { host: string; database: string; protocol: 'spacetimedb' };
  counts: { routes: number; stops: number; stopsWithCoordinates: number };
  routes: ExportRoute[];
  stops: ExportStop[];
}

export interface DatasetInput {
  routes: readonly Route[];
  stops: readonly BusStop[];
  routeStops: readonly RouteStop[];
  routeFares: readonly RouteFare[];
  fares: readonly Fare[];
  host: string;
  database: string;
}

/** A single, self-describing JSON snapshot of the whole public network. */
export function buildDataset(input: DatasetInput): ExportDataset {
  const stopById = buildStopMap(input.stops);
  const byRoute = buildRouteStopMap(input.routeStops);
  const fareByRoute = buildFareByRouteMap(input.fares);
  const routeFareMap = buildRouteFareMap(input.routeFares);

  const routes: ExportRoute[] = sortRoutesByNumber(input.routes).map(route => {
    const key = String(route.id);
    const routeStops = stopsForRoute(route.id, byRoute, stopById);
    const routeFare = fareByRoute.get(key);
    return {
      id: Number(route.id),
      number: route.number,
      name: route.name,
      terminus: route.terminus,
      color: route.color,
      description: route.description,
      fare: routeFare
        ? { adult: routeFare.adult, child: routeFare.child, night: routeFare.night }
        : null,
      stops: routeStops.map((stop, i) => ({
        sequence: i + 1,
        name: stop.name,
        fareToHere: fareToStop(key, String(stop.id), routeFareMap).adult,
      })),
    };
  });

  const stops: ExportStop[] = [...input.stops]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(stop => ({
      id: Number(stop.id),
      name: stop.name,
      latitude: stop.lat,
      longitude: stop.lng,
      hasCoordinates: hasCoordinates(stop),
    }));

  return {
    generatedAt: new Date().toISOString(),
    source: { host: input.host, database: input.database, protocol: 'spacetimedb' },
    counts: {
      routes: routes.length,
      stops: stops.length,
      stopsWithCoordinates: stops.filter(s => s.hasCoordinates).length,
    },
    routes,
    stops,
  };
}

function csvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  return [headers, ...rows].map(row => row.map(csvValue).join(',')).join('\r\n');
}

export function routesCsv(dataset: ExportDataset): string {
  return toCsv(
    ['number', 'name', 'terminus', 'adult_fare_cents', 'child_fare_cents', 'night_fare_cents', 'stops'],
    dataset.routes.map(r => [
      r.number,
      r.name,
      r.terminus,
      r.fare?.adult ?? '',
      r.fare?.child ?? '',
      r.fare?.night ?? '',
      r.stops.length,
    ])
  );
}

export function stopsCsv(dataset: ExportDataset): string {
  return toCsv(
    ['name', 'latitude', 'longitude', 'has_coordinates'],
    dataset.stops.map(s => [s.name, s.latitude, s.longitude, s.hasCoordinates])
  );
}

export function routeFaresCsv(dataset: ExportDataset): string {
  const rows: (string | number)[][] = [];
  for (const route of dataset.routes) {
    for (const stop of route.stops) {
      rows.push([route.number, route.name, stop.sequence, stop.name, stop.fareToHere]);
    }
  }
  return toCsv(['route_number', 'route_name', 'sequence', 'stop_name', 'fare_to_here_cents'], rows);
}

/** Trigger a client-side file download for generated data. */
export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

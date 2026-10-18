import { useMemo, useState } from 'react';
import type { BusStop, Fare, Route, RouteFare, RouteStop } from '../module_bindings/types';
import {
  buildFareByRouteMap,
  buildRouteFareMap,
  buildRouteStopMap,
  buildStopMap,
  fareToStop,
  formatFare,
  sortRoutesByNumber,
  stopsForRoute,
} from '../lib/journey';
import RouteBadge from './RouteBadge';

interface Props {
  routes: readonly Route[];
  routeStops: readonly RouteStop[];
  stops: readonly BusStop[];
  fares: readonly Fare[];
  routeFares: readonly RouteFare[];
}

export default function RoutesView({ routes, routeStops, stops, fares, routeFares }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const stopById = useMemo(() => buildStopMap(stops), [stops]);

  const byRoute = useMemo(() => buildRouteStopMap(routeStops), [routeStops]);

  const fareByRoute = useMemo(() => buildFareByRouteMap(fares), [fares]);

  const routeFareMap = useMemo(() => buildRouteFareMap(routeFares), [routeFares]);

  const sorted = useMemo(() => sortRoutesByNumber(routes), [routes]);

  if (sorted.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        No routes published yet.
      </p>
    );
  }

  return (
    <div className="grid items-start gap-4 sm:grid-cols-2">
      {sorted.map(route => {
        const key = String(route.id);
        const routeStopList = stopsForRoute(route.id, byRoute, stopById);
        const fare = fareByRoute.get(key);
        const isOpen = expanded === key;
        return (
          <article
            key={key}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <button
              onClick={() => setExpanded(isOpen ? null : key)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left"
            >
              <RouteBadge number={route.number} color={route.color} size="lg" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-slate-800 dark:text-slate-100">
                  {route.name}
                </span>
                <span className="block text-sm text-slate-500 dark:text-slate-400">
                  {routeStopList.length} stop{routeStopList.length === 1 ? '' : 's'} · to{' '}
                  {route.terminus} Bus Station
                </span>
              </span>
              <svg
                viewBox="0 0 24 24"
                className={`h-5 w-5 fill-slate-400 transition-transform dark:fill-slate-500 ${isOpen ? 'rotate-180' : ''}`}
              >
                <path d="M12 15.5 5.5 9l1.4-1.4L12 12.7l5.1-5.1L18.5 9 12 15.5Z" />
              </svg>
            </button>

            <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-3 text-xs dark:border-slate-800">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Adult {formatFare(fare?.adult)}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Child {formatFare(fare?.child)}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Night {formatFare(fare?.night)}
              </span>
            </div>

            {isOpen && (
              <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/50">
                {route.description && (
                  <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
                    {route.description}
                  </p>
                )}
                {routeStopList.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    No stops assigned to this route yet.
                  </p>
                ) : (
                  <ol className="ml-1">
                    {routeStopList.map((stop, i) => {
                      const isLast = i === routeStopList.length - 1;
                      return (
                        <li key={String(stop.id)} className={`relative pl-6 ${isLast ? '' : 'pb-4'}`}>
                          {!isLast && (
                            <span
                              aria-hidden="true"
                              className="absolute bottom-0 left-[5px] top-3 border-l-2 border-dashed border-brand-300 dark:border-brand-800"
                            />
                          )}
                          <span className="absolute left-0 top-1 grid h-3 w-3 place-items-center rounded-full border-2 border-brand-500 bg-white dark:bg-slate-900" />
                          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                            Stop {i + 1}
                            {isLast && ' · terminus'}
                          </span>
                          <div className="flex items-baseline justify-between gap-3">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              {stop.name}
                            </p>
                            <span className="shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {formatFare(fareToStop(key, String(stop.id), routeFareMap).adult)}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

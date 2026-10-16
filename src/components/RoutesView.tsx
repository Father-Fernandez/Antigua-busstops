import { useMemo, useState } from 'react';
import type { BusStop, Fare, Route, RouteFare, RouteStop } from '../module_bindings/types';
import { buildRouteFareMap, buildRouteStopMap, fareToStop, formatFare, stopsForRoute } from '../lib/journey';

interface Props {
  routes: readonly Route[];
  routeStops: readonly RouteStop[];
  stops: readonly BusStop[];
  fares: readonly Fare[];
  routeFares: readonly RouteFare[];
}

export default function RoutesView({ routes, routeStops, stops, fares, routeFares }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const stopById = useMemo(() => {
    const map = new Map<string, BusStop>();
    for (const s of stops) map.set(String(s.id), s);
    return map;
  }, [stops]);

  const byRoute = useMemo(() => buildRouteStopMap(routeStops), [routeStops]);

  const fareByRoute = useMemo(() => {
    const map = new Map<string, Fare>();
    for (const f of fares) map.set(String(f.routeId), f);
    return map;
  }, [fares]);

  const routeFareMap = useMemo(() => buildRouteFareMap(routeFares), [routeFares]);

  const sorted = useMemo(
    () => [...routes].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })),
    [routes]
  );

  if (sorted.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-slate-500">
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
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <button
              onClick={() => setExpanded(isOpen ? null : key)}
              className="flex w-full items-center gap-4 px-5 py-4 text-left"
            >
              <span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg font-extrabold text-white shadow-sm"
                style={{ backgroundColor: route.color || '#1f63f5' }}
              >
                {route.number}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-slate-800">{route.name}</span>
                <span className="block text-sm text-slate-500">
                  {routeStopList.length} stop{routeStopList.length === 1 ? '' : 's'} · to{' '}
                  {route.terminus} Bus Station
                </span>
              </span>
              <svg
                viewBox="0 0 24 24"
                className={`h-5 w-5 fill-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              >
                <path d="M12 15.5 5.5 9l1.4-1.4L12 12.7l5.1-5.1L18.5 9 12 15.5Z" />
              </svg>
            </button>

            <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-3 text-xs">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                Adult {formatFare(fare?.adult)}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                Child {formatFare(fare?.child)}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                Night {formatFare(fare?.night)}
              </span>
            </div>

            {isOpen && (
              <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                {route.description && (
                  <p className="mb-3 text-sm text-slate-500">{route.description}</p>
                )}
                {routeStopList.length === 0 ? (
                  <p className="text-sm text-slate-400">No stops assigned to this route yet.</p>
                ) : (
                  <ol className="relative ml-2 border-l-2 border-brand-200">
                    {routeStopList.map((stop, i) => (
                      <li key={String(stop.id)} className="mb-3 ml-4 last:mb-0">
                        <span className="absolute -left-[7px] grid h-3 w-3 place-items-center rounded-full border-2 border-brand-500 bg-white" />
                        <span className="text-xs font-semibold text-brand-600">
                          Stop {i + 1}
                        </span>
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-sm font-medium text-slate-700">{stop.name}</p>
                          <span className="shrink-0 text-xs font-semibold text-slate-500">
                            {formatFare(fareToStop(key, String(stop.id), routeFareMap).adult)}
                          </span>
                        </div>
                      </li>
                    ))}
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

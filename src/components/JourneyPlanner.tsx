import { useMemo, useState } from 'react';
import type { BusStop, Route, RouteFare, RouteStop } from '../module_bindings/types';
import { buildRouteFareMap, buildStopMap, formatFare, planJourney, type Itinerary } from '../lib/journey';
import RouteBadge from './RouteBadge';

interface Props {
  stops: readonly BusStop[];
  routes: readonly Route[];
  routeStops: readonly RouteStop[];
  routeFares: readonly RouteFare[];
}

function ItineraryCard({ itinerary }: { itinerary: Itinerary }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-center gap-3">
        {itinerary.legs.map((leg, i) => (
          <div key={i} className="flex items-center gap-3">
            {i > 0 && <span className="text-slate-300">→</span>}
            <RouteBadge number={leg.route.number} color={leg.route.color} />
            <div className="text-sm">
              <p className="font-semibold text-slate-800">{leg.route.name}</p>
              <p className="text-slate-500">
                {leg.from.name} → {leg.to.name}
              </p>
              <p className="text-xs font-semibold text-brand-600">
                {formatFare(leg.fare.adult)} adult
              </p>
            </div>
          </div>
        ))}
        <span className="ml-auto rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          {itinerary.kind === 'direct' ? 'Direct' : `1 transfer · ${itinerary.transferStop?.name}`}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center">
        <div>
          <dt className="text-xs text-slate-500">Adult</dt>
          <dd className="font-bold text-slate-800">{formatFare(itinerary.adult)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Child</dt>
          <dd className="font-bold text-slate-800">{formatFare(itinerary.child)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Night</dt>
          <dd className="font-bold text-slate-800">{formatFare(itinerary.night)}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function JourneyPlanner({ stops, routes, routeStops, routeFares }: Props) {
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [submitted, setSubmitted] = useState<{ origin: string; dest: string } | null>(null);

  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.name.localeCompare(b.name)),
    [stops]
  );

  const stopById = useMemo(() => buildStopMap(stops), [stops]);

  const routeFareMap = useMemo(() => buildRouteFareMap(routeFares), [routeFares]);

  const results = useMemo(() => {
    if (!submitted || !submitted.origin || !submitted.dest) return [];
    return planJourney(
      BigInt(submitted.origin),
      BigInt(submitted.dest),
      routes,
      routeStops,
      stopById,
      routeFareMap
    );
  }, [submitted, routes, routeStops, stopById, routeFareMap]);

  const swap = () => {
    setOrigin(dest);
    setDest(origin);
    setSubmitted(null);
  };

  const selectClass =
    'w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-slate-800 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200';

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      <div className="bg-gradient-to-br from-brand-50 to-white px-6 py-6 sm:px-8">
        <h2 className="text-xl font-extrabold text-slate-800 sm:text-2xl">
          Where are you going today?
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Pick your start and destination to see which buses to catch and what it costs.
        </p>

        <form
          className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end"
          onSubmit={e => {
            e.preventDefault();
            setSubmitted({ origin, dest });
          }}
        >
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              I am here
            </span>
            <select className={selectClass} value={origin} onChange={e => setOrigin(e.target.value)}>
              <option value="">Select a stop…</option>
              {sortedStops.map(s => (
                <option key={String(s.id)} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={swap}
            className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-brand-600 shadow-sm transition hover:bg-brand-50 sm:mb-0.5"
            aria-label="Swap origin and destination"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M7 7h9l-2.5-2.5L15 3l5 5-5 5-1.5-1.5L16 9H7V7Zm10 10H8l2.5 2.5L9 21l-5-5 5-5 1.5 1.5L8 15h9v2Z" />
            </svg>
          </button>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              I am going to
            </span>
            <select className={selectClass} value={dest} onChange={e => setDest(e.target.value)}>
              <option value="">Select a stop…</option>
              {sortedStops.map(s => (
                <option key={String(s.id)} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={!origin || !dest || origin === dest}
            className="h-[46px] rounded-xl bg-sun-500 px-6 font-bold text-slate-900 shadow-sm transition hover:bg-sun-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Find buses
          </button>
        </form>
      </div>

      {submitted && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-5 sm:px-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-600">
              {results.length > 0
                ? `${results.length} option${results.length > 1 ? 's' : ''} found`
                : 'No routes found'}
            </h3>
          </div>

          {results.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
              We couldn't find a bus connecting those two stops in the current data. Try a stop on
              a seeded route (e.g. St. Johns), or check back as more routes are added.
            </p>
          ) : (
            <div className="grid gap-3">
              {results.map((it, i) => (
                <ItineraryCard key={i} itinerary={it} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

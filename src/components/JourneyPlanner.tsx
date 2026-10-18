import { useMemo, useState } from 'react';
import type { BusStop, Place, Route, RouteFare, RouteStop } from '../module_bindings/types';
import {
  buildRouteFareMap,
  buildStopMap,
  formatFare,
  planJourney,
  type Itinerary,
} from '../lib/journey';
import { PLACE_CATEGORIES } from '../lib/places';
import RouteBadge from './RouteBadge';
import StopCombobox, { type ComboboxOption } from './StopCombobox';

interface Props {
  stops: readonly BusStop[];
  routes: readonly Route[];
  routeStops: readonly RouteStop[];
  routeFares: readonly RouteFare[];
  places: readonly Place[];
  initialFrom?: string;
  initialTo?: string;
  onPlan?: (from: string, to: string) => void;
}

const LAST_JOURNEY_KEY = 'bus-stop-antigua:last-journey:v2';

const stopOptionId = (id: bigint | string) => `stop:${id}`;
const placeOptionId = (id: bigint | string) => `place:${id}`;

function readLastJourney(): { from: string; to: string } | null {
  try {
    const raw = window.localStorage.getItem(LAST_JOURNEY_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof (parsed as { from?: unknown }).from === 'string' &&
      typeof (parsed as { to?: unknown }).to === 'string'
    ) {
      return parsed as { from: string; to: string };
    }
  } catch {
    /* ignore malformed storage */
  }
  return null;
}

function ItineraryCard({ itinerary }: { itinerary: Itinerary }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-3">
        {itinerary.legs.map((leg, i) => (
          <div key={i} className="flex items-center gap-3">
            {i > 0 && <span className="text-slate-300 dark:text-slate-600">→</span>}
            <RouteBadge number={leg.route.number} color={leg.route.color} />
            <div className="text-sm">
              <p className="font-semibold text-slate-800 dark:text-slate-100">{leg.route.name}</p>
              <p className="text-slate-500 dark:text-slate-400">
                {leg.from.name} → {leg.to.name}
              </p>
              <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                {formatFare(leg.fare.adult)} adult
              </p>
            </div>
          </div>
        ))}
        <span className="ml-auto rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
          {itinerary.kind === 'direct' ? 'Direct' : `1 transfer · ${itinerary.transferStop?.name}`}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center dark:border-slate-800">
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Adult</dt>
          <dd className="font-bold text-slate-800 dark:text-slate-100">
            {formatFare(itinerary.adult)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Child</dt>
          <dd className="font-bold text-slate-800 dark:text-slate-100">
            {formatFare(itinerary.child)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500 dark:text-slate-400">Night</dt>
          <dd className="font-bold text-slate-800 dark:text-slate-100">
            {formatFare(itinerary.night)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export default function JourneyPlanner({
  stops,
  routes,
  routeStops,
  routeFares,
  places,
  initialFrom,
  initialTo,
  onPlan,
}: Props) {
  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.name.localeCompare(b.name)),
    [stops]
  );

  // Every option the picker offers: bus stops, then reachable places by category.
  // Value ids are option ids (`stop:5`, `place:7`); `resolveStopId` maps them to
  // the stop the planner actually routes through.
  const { options, resolveStopId } = useMemo(() => {
    const optionList: ComboboxOption[] = sortedStops.map(s => ({
      id: stopOptionId(s.id),
      label: s.name,
      group: 'Bus stops',
    }));
    const lookup = new Map<string, string>();
    for (const s of sortedStops) lookup.set(stopOptionId(s.id), String(s.id));

    for (const category of PLACE_CATEGORIES) {
      for (const place of places.filter(p => p.category === category.id && p.nearestStopId !== 0n)) {
        optionList.push({
          id: placeOptionId(place.id),
          label: place.name,
          group: category.plural,
        });
        lookup.set(placeOptionId(place.id), String(place.nearestStopId));
      }
    }
    return { options: optionList, resolveStopId: lookup };
  }, [sortedStops, places]);

  const urlJourney = useMemo(() => {
    if (
      initialFrom &&
      initialTo &&
      initialFrom !== initialTo &&
      resolveStopId.has(initialFrom) &&
      resolveStopId.has(initialTo)
    ) {
      return { from: initialFrom, to: initialTo };
    }
    return null;
  }, [initialFrom, initialTo, resolveStopId]);

  const remembered = useMemo(() => {
    const last = readLastJourney();
    if (last && resolveStopId.has(last.from) && resolveStopId.has(last.to)) return last;
    return null;
  }, [resolveStopId]);

  const start = urlJourney ?? remembered;

  const [origin, setOrigin] = useState(start?.from ?? '');
  const [dest, setDest] = useState(start?.to ?? '');
  const [submitted, setSubmitted] = useState<{ origin: string; dest: string } | null>(
    urlJourney ? { origin: urlJourney.from, dest: urlJourney.to } : null
  );

  const stopById = useMemo(() => buildStopMap(stops), [stops]);
  const routeFareMap = useMemo(() => buildRouteFareMap(routeFares), [routeFares]);

  const results = useMemo(() => {
    if (!submitted) return [];
    const from = resolveStopId.get(submitted.origin);
    const to = resolveStopId.get(submitted.dest);
    if (!from || !to || from === to) return [];
    return planJourney(BigInt(from), BigInt(to), routes, routeStops, stopById, routeFareMap);
  }, [submitted, resolveStopId, routes, routeStops, stopById, routeFareMap]);

  const plan = (from: string, to: string) => {
    const fromStop = resolveStopId.get(from);
    const toStop = resolveStopId.get(to);
    if (!fromStop || !toStop || fromStop === toStop) return;
    setSubmitted({ origin: from, dest: to });
    try {
      window.localStorage.setItem(LAST_JOURNEY_KEY, JSON.stringify({ from, to }));
    } catch {
      /* storage may be unavailable */
    }
    onPlan?.(from, to);
  };

  const chooseOrigin = (id: string) => {
    setOrigin(id);
    setSubmitted(null);
  };
  const chooseDest = (id: string) => {
    setDest(id);
    setSubmitted(null);
  };

  const swap = () => {
    setOrigin(dest);
    setDest(origin);
    setSubmitted(null);
  };

  const sameStop = resolveStopId.get(origin) === resolveStopId.get(dest);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
      <div className="bg-gradient-to-br from-brand-50 to-white px-6 py-6 dark:from-slate-900 dark:to-slate-900 sm:px-8">
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 sm:text-2xl">
          Where are you going today?
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Pick your start and destination — bus stops and tourist spots both work.
        </p>

        <form
          className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end"
          onSubmit={e => {
            e.preventDefault();
            if (origin && dest && !sameStop) plan(origin, dest);
          }}
        >
          <StopCombobox
            label="I am here"
            options={options}
            value={origin}
            onChange={chooseOrigin}
            placeholder="Search stops, beaches, places…"
          />

          <button
            type="button"
            onClick={swap}
            className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-brand-600 shadow-sm transition hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-900 dark:text-brand-400 dark:hover:bg-slate-800 sm:mb-0.5"
            aria-label="Swap origin and destination"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M7 7h9l-2.5-2.5L15 3l5 5-5 5-1.5-1.5L16 9H7V7Zm10 10H8l2.5 2.5L9 21l-5-5 5-5 1.5 1.5L8 15h9v2Z" />
            </svg>
          </button>

          <StopCombobox
            label="I am going to"
            options={options}
            value={dest}
            onChange={chooseDest}
            placeholder="Search stops, beaches, places…"
          />

          <button
            type="submit"
            disabled={!origin || !dest || sameStop}
            className="h-[46px] rounded-xl bg-sun-500 px-6 font-bold text-slate-900 shadow-sm transition hover:bg-sun-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Find buses
          </button>
        </form>
      </div>

      {submitted && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/50 sm:px-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {results.length > 0
                ? `${results.length} option${results.length > 1 ? 's' : ''} found`
                : 'No routes found'}
            </h3>
          </div>

          {results.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
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

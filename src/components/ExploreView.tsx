import { useMemo } from 'react';
import type { BusStop, Place } from '../module_bindings/types';
import { buildStopMap, hasCoordinates } from '../lib/journey';
import { groupPlaces } from '../lib/places';
import { navigate } from '../lib/router';

interface Props {
  places: readonly Place[];
  stops: readonly BusStop[];
}

export default function ExploreView({ places, stops }: Props) {
  const stopById = useMemo(() => buildStopMap(stops), [stops]);
  const groups = useMemo(() => groupPlaces(places), [places]);

  if (places.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        No destinations have been added yet.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 sm:text-2xl">
          Explore Antigua
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Beaches and landmarks you can reach by bus. Pick one to see how to get there.
        </p>
      </div>

      {groups.map(group => (
        <section key={group.meta.id} className="space-y-4">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: group.meta.color }}
              aria-hidden="true"
            />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {group.meta.plural}
            </h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {group.places.length}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.places.map(place => {
              const nearest =
                place.nearestStopId !== 0n
                  ? stopById.get(String(place.nearestStopId))
                  : undefined;
              const reachable = Boolean(nearest);
              return (
                <article
                  key={String(place.id)}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">{place.name}</h4>
                    {!hasCoordinates(place) && (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                        Unmapped
                      </span>
                    )}
                  </div>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {place.description}
                  </p>

                  <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {reachable ? (
                        <>
                          Nearest stop:{' '}
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {nearest!.name}
                          </span>
                        </>
                      ) : (
                        'No nearby stop yet'
                      )}
                    </p>
                    <button
                      type="button"
                      disabled={!reachable}
                      onClick={() => navigate('planner', { to: `place:${place.id}` })}
                      className="mt-3 w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Plan a bus
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

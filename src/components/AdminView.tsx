import { useMemo, useState } from 'react';
import { reducers } from '../module_bindings';
import { useReducer } from 'spacetimedb/react';
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
  stops: readonly BusStop[];
  routeStops: readonly RouteStop[];
  fares: readonly Fare[];
  routeFares: readonly RouteFare[];
  isAdmin: boolean;
  hasAdmins: boolean;
}

const PALETTE = ['#d32630', '#000000', '#407fc9', '#f4d840'];

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

function toCents(value: string): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export default function AdminView({
  routes,
  stops,
  routeStops,
  fares,
  routeFares,
  isAdmin,
  hasAdmins,
}: Props) {
  const claimAdmin = useReducer(reducers.claimAdmin);
  const [claimError, setClaimError] = useState('');
  const addRoute = useReducer(reducers.addRoute);
  const deleteRoute = useReducer(reducers.deleteRoute);
  const setFare = useReducer(reducers.setFare);
  const setRouteFare = useReducer(reducers.setRouteFare);
  const addStopToRoute = useReducer(reducers.addStopToRoute);
  const addStop = useReducer(reducers.addStop);

  const [form, setForm] = useState({
    number: '',
    name: '',
    terminus: 'West',
    color: PALETTE[2],
    description: '',
  });
  const [stopForm, setStopForm] = useState({ name: '', lat: '', lng: '' });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fareForm, setFareForm] = useState({ adult: '', child: '', night: '' });
  const [stopFareId, setStopFareId] = useState('');
  const [stopFareForm, setStopFareForm] = useState({ adult: '', child: '', night: '' });
  const [stopToAdd, setStopToAdd] = useState('');

  const stopById = useMemo(() => buildStopMap(stops), [stops]);

  const byRoute = useMemo(() => buildRouteStopMap(routeStops), [routeStops]);

  const fareByRoute = useMemo(() => buildFareByRouteMap(fares), [fares]);

  const routeFareMap = useMemo(() => buildRouteFareMap(routeFares), [routeFares]);

  const sortedRoutes = useMemo(() => sortRoutesByNumber(routes), [routes]);

  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.name.localeCompare(b.name)),
    [stops]
  );

  if (!hasAdmins) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-sun-200 bg-white px-6 py-8 text-center shadow-sm dark:border-sun-500/25 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Set up admin access</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Nobody can edit the bus network yet. If you run this site, claim admin access now. The first
          person to claim becomes an editor, and the option disappears for everyone else.
        </p>
        <button
          type="button"
          onClick={() => {
            setClaimError('');
            claimAdmin().catch(err => setClaimError(String(err?.message ?? err)));
          }}
          className="mt-5 rounded-lg bg-flag-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-flag-600"
        >
          Claim admin access
        </button>
        {claimError && (
          <p className="mt-3 text-sm text-flag-600 dark:text-flag-400">{claimError}</p>
        )}
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Admins only</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          The bus network is read-only for the public. Editing is limited to administrators, and this
          browser isn&apos;t one of them. Only the browser that claimed admin access can make changes.
        </p>
      </div>
    );
  }

  const submitRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addRoute({
      number: form.number.trim(),
      name: form.name.trim(),
      terminus: form.terminus,
      color: form.color,
      description: form.description.trim(),
    });
    setForm({ number: '', name: '', terminus: 'West', color: PALETTE[2], description: '' });
  };

  const submitStop = (e: React.FormEvent) => {
    e.preventDefault();
    const name = stopForm.name.trim();
    if (!name) return;
    addStop({
      name,
      lat: Number.parseFloat(stopForm.lat) || 0,
      lng: Number.parseFloat(stopForm.lng) || 0,
    });
    setStopForm({ name: '', lat: '', lng: '' });
  };

  const openManage = (route: Route) => {
    const key = String(route.id);
    if (expanded === key) {
      setExpanded(null);
      return;
    }
    const fare = fareByRoute.get(key);
    setFareForm({
      adult: fare ? (fare.adult / 100).toFixed(2) : '',
      child: fare ? (fare.child / 100).toFixed(2) : '',
      night: fare ? (fare.night / 100).toFixed(2) : '',
    });
    setStopToAdd('');
    setStopFareId('');
    setStopFareForm({ adult: '', child: '', night: '' });
    setExpanded(key);
  };

  const pickFareStop = (route: Route, stopId: string) => {
    setStopFareId(stopId);
    if (!stopId) {
      setStopFareForm({ adult: '', child: '', night: '' });
      return;
    }
    const f = fareToStop(String(route.id), stopId, routeFareMap);
    setStopFareForm({
      adult: (f.adult / 100).toFixed(2),
      child: (f.child / 100).toFixed(2),
      night: (f.night / 100).toFixed(2),
    });
  };

  const removeRoute = (route: Route) => {
    if (!window.confirm(`Delete route ${route.number} — ${route.name}? This cannot be undone.`))
      return;
    deleteRoute({ routeId: route.id });
    if (expanded === String(route.id)) setExpanded(null);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Add a bus route</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Create a route, then expand it below to set fares and assign stops.
        </p>
        <form onSubmit={submitRoute} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Number</span>
            <input
              className={inputClass}
              inputMode="numeric"
              placeholder="e.g. 15"
              value={form.number}
              onChange={e => setForm({ ...form, number: e.target.value })}
            />
          </label>
          <label className="block lg:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Name</span>
            <input
              className={inputClass}
              placeholder="e.g. Horsford Hill"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Terminus
            </span>
            <select
              className={inputClass}
              value={form.terminus}
              onChange={e => setForm({ ...form, terminus: e.target.value })}
            >
              <option value="West">West Bus Station</option>
              <option value="East">East Bus Station</option>
            </select>
          </label>
          <label className="block lg:col-span-3">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Description
            </span>
            <input
              className={inputClass}
              placeholder="Optional description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <div className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Colour
            </span>
            <div className="flex items-center gap-2">
              {PALETTE.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`h-8 w-8 rounded-full ring-2 ring-offset-2 transition ${
                    form.color === c ? 'ring-slate-800 dark:ring-slate-100' : 'ring-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Use colour ${c}`}
                />
              ))}
            </div>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={!form.name.trim()}
              className="rounded-lg bg-flag-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-flag-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add route
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Add a bus stop</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          New stops become available to assign to routes immediately.
        </p>
        <form onSubmit={submitStop} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block lg:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Name</span>
            <input
              className={inputClass}
              placeholder="e.g. Sea View Farm"
              value={stopForm.name}
              onChange={e => setStopForm({ ...stopForm, name: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Latitude
            </span>
            <input
              className={inputClass}
              inputMode="decimal"
              placeholder="17.12"
              value={stopForm.lat}
              onChange={e => setStopForm({ ...stopForm, lat: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Longitude
            </span>
            <input
              className={inputClass}
              inputMode="decimal"
              placeholder="-61.84"
              value={stopForm.lng}
              onChange={e => setStopForm({ ...stopForm, lng: e.target.value })}
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={!stopForm.name.trim()}
              className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add stop
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Manage routes</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {routes.length} total
          </span>
        </div>

        {sortedRoutes.length === 0 ? (
          <p className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No routes yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedRoutes.map(route => {
              const key = String(route.id);
              const isOpen = expanded === key;
              const routeStopsList = stopsForRoute(route.id, byRoute, stopById);
              const fare = fareByRoute.get(key);
              return (
                <li key={key}>
                  <div className="flex flex-wrap items-center gap-3 px-6 py-4">
                    <RouteBadge number={route.number} color={route.color} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                        {route.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {route.terminus} Bus Station · {routeStopsList.length} stop
                        {routeStopsList.length === 1 ? '' : 's'} · Adult {formatFare(fare?.adult)}
                      </p>
                    </div>
                    <button
                      onClick={() => openManage(route)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {isOpen ? 'Close' : 'Manage'}
                    </button>
                    <button
                      onClick={() => removeRoute(route)}
                      className="rounded-lg border border-flag-100 bg-flag-50 px-3 py-1.5 text-sm font-semibold text-flag-600 transition hover:bg-flag-100 dark:border-flag-500/30 dark:bg-flag-500/15 dark:text-flag-400 dark:hover:bg-flag-500/25"
                    >
                      Delete
                    </button>
                  </div>

                  {isOpen && (
                    <div className="grid gap-6 border-t border-slate-100 bg-slate-50/60 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/50 lg:grid-cols-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          Fares (EC$)
                        </h3>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {(['adult', 'child', 'night'] as const).map(field => (
                            <label key={field} className="block">
                              <span className="mb-1 block text-xs font-semibold capitalize text-slate-500 dark:text-slate-400">
                                {field}
                              </span>
                              <input
                                className={inputClass}
                                inputMode="decimal"
                                placeholder="0.00"
                                value={fareForm[field]}
                                onChange={e =>
                                  setFareForm({ ...fareForm, [field]: e.target.value })
                                }
                              />
                            </label>
                          ))}
                        </div>
                        <button
                          onClick={() =>
                            setFare({
                              routeId: route.id,
                              adult: toCents(fareForm.adult),
                              child: toCents(fareForm.child),
                              night: toCents(fareForm.night),
                            })
                          }
                          className="mt-3 rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600"
                        >
                          Save fares
                        </button>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          Stops on this route
                        </h3>
                        {routeStopsList.length === 0 ? (
                          <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">
                            No stops assigned yet.
                          </p>
                        ) : (
                          <ol className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                            {routeStopsList.map((stop, i) => (
                              <li key={String(stop.id)} className="flex items-center gap-2">
                                <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                                  {i + 1}
                                </span>
                                <span className="flex-1">{stop.name}</span>
                                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                                  {formatFare(fareToStop(key, String(stop.id), routeFareMap).adult)}
                                </span>
                              </li>
                            ))}
                          </ol>
                        )}

                        <div className="mt-4 flex flex-wrap items-end gap-2">
                          <label className="block min-w-[12rem] flex-1">
                            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                              Add stop
                            </span>
                            <select
                              className={inputClass}
                              value={stopToAdd}
                              onChange={e => setStopToAdd(e.target.value)}
                            >
                              <option value="">Select a stop…</option>
                              {sortedStops.map(s => (
                                <option key={String(s.id)} value={String(s.id)}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button
                            disabled={!stopToAdd}
                            onClick={() => {
                              addStopToRoute({
                                routeId: route.id,
                                stopId: BigInt(stopToAdd),
                                sequence: routeStopsList.length + 1,
                              });
                              setStopToAdd('');
                            }}
                            className="rounded-lg bg-sun-500 px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-sun-400 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Add
                          </button>
                        </div>

                        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            Per-stop fare (EC$)
                          </h4>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Fare to reach each stop from St. John&apos;s, used to price journeys.
                          </p>
                          <select
                            className={`${inputClass} mt-3`}
                            value={stopFareId}
                            onChange={e => pickFareStop(route, e.target.value)}
                          >
                            <option value="">Select a stop…</option>
                            {routeStopsList.map(s => (
                              <option key={String(s.id)} value={String(s.id)}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {(['adult', 'child', 'night'] as const).map(field => (
                              <label key={field} className="block">
                                <span className="mb-1 block text-xs font-semibold capitalize text-slate-500 dark:text-slate-400">
                                  {field}
                                </span>
                                <input
                                  className={inputClass}
                                  inputMode="decimal"
                                  placeholder="0.00"
                                  value={stopFareForm[field]}
                                  onChange={e =>
                                    setStopFareForm({ ...stopFareForm, [field]: e.target.value })
                                  }
                                />
                              </label>
                            ))}
                          </div>
                          <button
                            disabled={!stopFareId}
                            onClick={() =>
                              setRouteFare({
                                routeId: route.id,
                                stopId: BigInt(stopFareId),
                                adult: toCents(stopFareForm.adult),
                                child: toCents(stopFareForm.child),
                                night: toCents(stopFareForm.night),
                              })
                            }
                            className="mt-3 rounded-lg bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Save stop fare
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        The bus network is locked down server-side: only identities listed in the <code>admin</code>{' '}
        table can run these actions. Everyone else can read the data but not change it.
      </p>
    </div>
  );
}

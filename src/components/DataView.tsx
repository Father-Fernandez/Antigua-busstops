import { useMemo, useState } from 'react';
import type { BusStop, Fare, Place, Route, RouteFare, RouteStop } from '../module_bindings/types';
import {
  buildDataset,
  downloadFile,
  placesCsv,
  routeFaresCsv,
  routesCsv,
  stopsCsv,
} from '../lib/export';

interface Props {
  routes: readonly Route[];
  stops: readonly BusStop[];
  routeStops: readonly RouteStop[];
  routeFares: readonly RouteFare[];
  fares: readonly Fare[];
  places: readonly Place[];
  host: string;
  database: string;
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:bg-white/20"
    >
      {copied ? 'Copied' : (label ?? 'Copy')}
    </button>
  );
}

function CodeBlock({ code, copy }: { code: string; copy?: boolean }) {
  return (
    <div className="mt-2 flex items-start gap-3 overflow-hidden rounded-xl bg-slate-900 px-4 py-3">
      <pre className="min-w-0 flex-1 overflow-x-auto text-xs leading-relaxed text-slate-100">
        <code>{code}</code>
      </pre>
      {copy !== false && <CopyButton text={code} />}
    </div>
  );
}

export default function DataView({
  routes,
  stops,
  routeStops,
  routeFares,
  fares,
  places,
  host,
  database,
}: Props) {
  const dataset = useMemo(
    () => buildDataset({ routes, stops, routeStops, routeFares, fares, places, host, database }),
    [routes, stops, routeStops, routeFares, fares, places, host, database]
  );

  const downloads = [
    {
      label: 'Everything (JSON)',
      detail: `${dataset.counts.routes} routes · ${dataset.counts.stops} stops · ${dataset.counts.places} places`,
      run: () =>
        downloadFile(
          'bus-stop-antigua.json',
          JSON.stringify(dataset, null, 2),
          'application/json'
        ),
    },
    {
      label: 'Routes (CSV)',
      detail: 'Number, name and fares',
      run: () => downloadFile('bus-stop-antigua-routes.csv', routesCsv(dataset), 'text/csv'),
    },
    {
      label: 'Stops (CSV)',
      detail: 'Names and coordinates',
      run: () => downloadFile('bus-stop-antigua-stops.csv', stopsCsv(dataset), 'text/csv'),
    },
    {
      label: 'Route fares (CSV)',
      detail: 'Fare to reach each stop',
      run: () => downloadFile('bus-stop-antigua-route-fares.csv', routeFaresCsv(dataset), 'text/csv'),
    },
    {
      label: 'Places (CSV)',
      detail: 'Beaches, sites and their nearest stop',
      run: () => downloadFile('bus-stop-antigua-places.csv', placesCsv(dataset), 'text/csv'),
    },
  ];

  const wsUrl = `${host.replace(/^wss?:\/\//, '')}/${database}`;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Open data</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Every route, stop and fare here is public. The data lives in a SpacetimeDB database and is
          readable by anyone, download it below, or connect your own tools straight to the live
          database. There is no sign-up, key or paywall.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {downloads.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={item.run}
              className="flex flex-col items-start gap-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-brand-700 dark:hover:bg-slate-800"
            >
              <span className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-brand-600 dark:fill-brand-400">
                  <path d="M12 3v10.6l3.3-3.3 1.4 1.4L12 17.4l-4.7-4.7 1.4-1.4L12 13.6V3h0ZM5 19h14v2H5v-2Z" />
                </svg>
                {item.label}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{item.detail}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          How the public can access it
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          The database is hosted on SpacetimeDB Maincloud. Point any SpacetimeDB client; the CLI,
          the TypeScript/Rust/C# SDKs at the host and database name below, subscribe to the public
          tables, and you get the same live data this site shows.
        </p>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Host
            </dt>
            <dd className="mt-1 break-all font-mono text-sm text-slate-800 dark:text-slate-100">
              {host}
            </dd>
          </div>
          <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Database
            </dt>
            <dd className="mt-1 break-all font-mono text-sm text-slate-800 dark:text-slate-100">
              {database}
            </dd>
          </div>
        </dl>

        <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Query it with the SpacetimeDB CLI
        </h3>
        <CodeBlock code={`spacetime sql ${database} "SELECT number, name, terminus FROM route"`} />
        <CodeBlock code={`spacetime sql ${database} "SELECT name, lat, lng FROM bus_stop"`} />
        <CodeBlock code={`spacetime sql ${database} "SELECT * FROM route_fare"`} />
        <CodeBlock code={`spacetime sql ${database} "SELECT name, category, lat, lng FROM place"`} />

        <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Subscribe from any client
        </h3>
        <CodeBlock
          code={`import { DbConnection } from './module_bindings';\n\nDbConnection.builder()\n  .withUri('${host}')\n  .withDatabaseName('${database}')\n  .subscribe(['route', 'bus_stop', 'route_stop', 'fare', 'route_fare', 'place']);`}
        />

        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          Live endpoint: <span className="font-mono">{wsUrl}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-6">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Table reference</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="py-2 pr-4 font-semibold">Table</th>
                <th className="py-2 pr-4 font-semibold">Contents</th>
                <th className="py-2 pr-4 font-semibold">Access</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              {[
                ['route', 'Route number, name, terminus, colour', 'Read'],
                ['bus_stop', 'Stop names and coordinates', 'Read'],
                ['route_stop', 'Which stops belong to each route, in order', 'Read'],
                ['fare', 'Per-route adult / child / night fares', 'Read'],
                ['route_fare', 'Fare to reach each stop from St. John’s', 'Read'],
                ['place', 'Beaches, sites and their nearest stop', 'Read'],
              ].map(([table, contents, access]) => (
                <tr key={table} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                  <td className="py-2 pr-4 font-mono text-xs text-slate-800 dark:text-slate-100">
                    {table}
                  </td>
                  <td className="py-2 pr-4">{contents}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        access === 'Private'
                          ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                      }`}
                    >
                      {access}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          Reads are open to everyone; writes are restricted to administrators, so the public data
          cannot be edited through the app.
        </p>
      </div>
    </div>
  );
}

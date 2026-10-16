import { useMemo, useState } from 'react';
import type { BusStop } from '../module_bindings/types';

interface Props {
  stops: readonly BusStop[];
}

export default function StopsView({ stops }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...stops]
      .filter(s => (q ? s.name.toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [stops, query]);

  const missing = useMemo(() => stops.filter(s => s.lat === 0 && s.lng === 0).length, [stops]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 fill-slate-400"
          >
            <path d="M10 4a6 6 0 1 0 3.5 10.9l4.3 4.3 1.4-1.4-4.3-4.3A6 6 0 0 0 10 4Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search stops…"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-800 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          />
        </div>
        <div className="flex gap-2 text-xs font-medium text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1.5">{stops.length} stops</span>
          {missing > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-700">
              {missing} without coords
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(stop => (
          <div
            key={String(stop.id)}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-brand-300 hover:shadow-md"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M12 2a7 7 0 0 0-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
              </svg>
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate font-semibold text-slate-800">{stop.name}</span>
              {stop.lat === 0 && stop.lng === 0 && (
                <span className="shrink-0 rounded-full bg-sun-500/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sun-600">
                  Location pending
                </span>
              )}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-slate-500">
            No stops match "{query}".
          </p>
        )}
      </div>
    </div>
  );
}

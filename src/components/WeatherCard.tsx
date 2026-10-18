import { useEffect, useState } from 'react';
import { fetchAntiguaWeather, type AntiguaWeather } from '../lib/weather';

interface Props {
  className?: string;
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M12 6V3l-4 4 4 4V8a4 4 0 1 1-4 4H6a6 6 0 1 0 6-6Z" />
    </svg>
  );
}

export default function WeatherCard({ className = '' }: Props) {
  const [weather, setWeather] = useState<AntiguaWeather | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    fetchAntiguaWeather()
      .then(data => {
        if (!alive) return;
        setWeather(data);
        setStatus('ready');
      })
      .catch(() => {
        if (alive) setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  return (
    <div
      className={`flex flex-col rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Weather · Antigua
        </p>
        <button
          type="button"
          onClick={() => setReloadKey(k => k + 1)}
          disabled={status === 'loading'}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Refresh weather"
          title="Refresh weather"
        >
          <RefreshIcon />
        </button>
      </div>

      {status === 'loading' && (
        <div className="mt-3 animate-pulse space-y-2">
          <div className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-4 w-32 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      )}

      {status === 'error' && (
        <div className="mt-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Weather is unavailable right now.
          </p>
          <button
            type="button"
            onClick={() => setReloadKey(k => k + 1)}
            className="mt-2 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Try again
          </button>
        </div>
      )}

      {status === 'ready' && weather && (
        <>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-4xl leading-none" aria-hidden="true">
              {weather.icon}
            </span>
            <div className="min-w-0">
              <p className="text-3xl font-extrabold leading-none text-slate-800 dark:text-slate-100">
                {Math.round(weather.temperature)}°
                <span className="ml-0.5 align-top text-base font-bold text-slate-400 dark:text-slate-500">
                  C
                </span>
              </p>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                {weather.condition}
              </p>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center text-slate-600 dark:border-slate-800 dark:text-slate-300">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Feels
              </dt>
              <dd className="text-sm font-semibold">{Math.round(weather.feelsLike)}°</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Humidity
              </dt>
              <dd className="text-sm font-semibold">{Math.round(weather.humidity)}%</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Wind
              </dt>
              <dd className="text-sm font-semibold">{Math.round(weather.windSpeed)} km/h</dd>
            </div>
          </dl>
          {weather.high !== null && weather.low !== null && (
            <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500">
              High {Math.round(weather.high)}° · Low {Math.round(weather.low)}°
            </p>
          )}
        </>
      )}
    </div>
  );
}

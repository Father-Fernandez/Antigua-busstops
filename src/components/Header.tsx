import { useState } from 'react';
import FlagStripe from './FlagStripe';

export type Page = 'planner' | 'map' | 'routes' | 'stops' | 'admin' | 'about';

const NAV: { id: Page; label: string }[] = [
  { id: 'planner', label: 'Journey Planner' },
  { id: 'map', label: 'Map' },
  { id: 'routes', label: 'Bus Routes' },
  { id: 'stops', label: 'Bus Stops' },
  { id: 'admin', label: 'Admin' },
  { id: 'about', label: 'About' },
];

interface HeaderProps {
  page: Page;
  onNavigate: (page: Page) => void;
  connected: boolean;
  vehicleCount: number;
}

function BusLogo() {
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-flag-500 ring-1 ring-white/20">
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" aria-hidden="true">
        <path d="M4 16V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a1 1 0 0 1-1 1h-1v1.5a1.5 1.5 0 0 1-3 0V17H8v1.5a1.5 1.5 0 0 1-3 0V17H5a1 1 0 0 1-1-1Zm3-9h10v4H7V7Zm.5 8a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Zm9 0a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" />
      </svg>
    </span>
  );
}

export default function Header({ page, onNavigate, connected, vehicleCount }: HeaderProps) {
  const [open, setOpen] = useState(false);

  const go = (id: Page) => {
    onNavigate(id);
    setOpen(false);
  };

  return (
    <header className="relative z-40">
      <div className="bg-ink text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <button
            onClick={() => go('planner')}
            className="flex items-center gap-3 text-left transition hover:opacity-90"
          >
            <BusLogo />
            <span>
              <span className="block text-lg font-extrabold leading-tight tracking-tight sm:text-xl">
                Bus Stop Antigua
              </span>
              <span className="block text-xs text-white/60">
                Getting Around Antigua Made Easy
              </span>
            </span>
          </button>

          <div className="hidden items-center gap-4 md:flex">
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium ring-1 ring-white/20">
              <span
                className={`h-2 w-2 rounded-full ${
                  connected ? 'bg-emerald-400 animate-pulse' : 'bg-flag-400'
                }`}
              />
              {connected ? 'Live' : 'Offline'}
              {vehicleCount > 0 && (
                <span className="text-white/70">· {vehicleCount} tracked</span>
              )}
            </span>
          </div>

          <button
            className="md:hidden rounded-lg p-2 ring-1 ring-white/25 hover:bg-white/10"
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
              {open ? (
                <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6 6.4 5Z" />
              ) : (
                <path d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto hidden max-w-6xl gap-1 px-4 sm:px-6 md:flex">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              className={`relative px-4 py-3 text-sm font-semibold transition ${
                page === item.id ? 'text-flag-600' : 'text-slate-500 hover:text-brand-600'
              }`}
            >
              {item.label}
              {page === item.id && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-flag-500" />
              )}
            </button>
          ))}
        </div>

        {open && (
          <div className="flex flex-col px-4 pb-3 md:hidden">
            {NAV.map(item => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={`rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${
                  page === item.id
                    ? 'bg-flag-50 text-flag-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      <FlagStripe />
    </header>
  );
}

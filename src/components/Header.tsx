import { useState } from 'react';
import FlagStripe from './FlagStripe';
import type { Theme } from '../lib/theme';
import type { Page } from '../lib/router';

const NAV: { id: Page; label: string }[] = [
  { id: 'planner', label: 'Journey Planner' },
  { id: 'map', label: 'Map' },
  { id: 'explore', label: 'Explore' },
  { id: 'routes', label: 'Bus Routes' },
  { id: 'data', label: 'Data' },
  { id: 'admin', label: 'Admin' },
  { id: 'about', label: 'About' },
];

interface HeaderProps {
  page: Page;
  onNavigate: (page: Page) => void;
  theme: Theme;
  onToggleTheme: () => void;
  showAdmin: boolean;
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2.5a1 1 0 0 1 1 1V22a1 1 0 0 1-2 0v-1.5a1 1 0 0 1 1-1Zm0-20a1 1 0 0 1 1 1v1.5a1 1 0 0 1-2 0V1.5a1 1 0 0 1 1-1Zm10 9.5a1 1 0 0 1 0 2h-1.5a1 1 0 0 1 0-2H22ZM3.5 11a1 1 0 0 1 0 2H2a1 1 0 0 1 0-2h1.5Zm15.3-6.8a1 1 0 0 1 0 1.4l-1 1a1 1 0 1 1-1.5-1.4l1-1a1 1 0 0 1 1.5 0ZM7.7 16.3a1 1 0 0 1 0 1.4l-1 1a1 1 0 1 1-1.5-1.4l1-1a1 1 0 0 1 1.5 0Zm11.1 2.4a1 1 0 0 1-1.4 1.5l-1-1a1 1 0 0 1 1.4-1.5l1 1ZM7.7 7.7a1 1 0 0 1-1.4 0l-1-1a1 1 0 0 1 1.4-1.4l1 1a1 1 0 0 1 0 1.4Z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
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

export default function Header({
  page,
  onNavigate,
  theme,
  onToggleTheme,
  showAdmin,
}: HeaderProps) {
  const [open, setOpen] = useState(false);
  const nav = showAdmin ? NAV : NAV.filter(item => item.id !== 'admin');

  const go = (id: Page) => {
    onNavigate(id);
    setOpen(false);
  };

  return (
    <header className="relative z-40">
      <div className="bg-ink text-white dark:bg-slate-900">
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
              <span className="hidden text-xs text-white/60 sm:block">
                Getting Around Antigua Made Easy
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="grid h-9 w-9 place-items-center rounded-lg text-white ring-1 ring-white/25 transition hover:bg-white/10"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            <button
              className="rounded-lg p-2 ring-1 ring-white/25 hover:bg-white/10 lg:hidden"
              onClick={() => setOpen(o => !o)}
              aria-label="Toggle navigation"
              aria-expanded={open}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" aria-hidden="true">
                {open ? (
                  <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6 6.4 5Z" />
                ) : (
                  <path d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      <nav
        aria-label="Primary"
        className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mx-auto hidden max-w-6xl gap-1 px-4 sm:px-6 lg:flex">
          {nav.map(item => (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              aria-current={page === item.id ? 'page' : undefined}
              className={`relative px-4 py-3 text-sm font-semibold transition ${
                page === item.id
                  ? 'text-flag-600 dark:text-flag-400'
                  : 'text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300'
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
          <div className="flex flex-col px-4 pb-3 lg:hidden">
            {nav.map(item => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                aria-current={page === item.id ? 'page' : undefined}
                className={`rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${
                  page === item.id
                    ? 'bg-flag-50 text-flag-600 dark:bg-flag-500/15 dark:text-flag-400'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
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

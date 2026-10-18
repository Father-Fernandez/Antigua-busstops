import FlagStripe from './FlagStripe';
import { ExternalLink } from './LegacyLinks';
import { OLD_SITE_URL } from '../lib/links';

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <FlagStripe />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-8">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                  <path d="M4 16V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a1 1 0 0 1-1 1h-1v1.5a1.5 1.5 0 0 1-3 0V17H8v1.5a1.5 1.5 0 0 1-3 0V17H5a1 1 0 0 1-1-1Zm3-9h10v4H7V7Z" />
                </svg>
              </span>
              Bus Stop Antigua
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Live bus tracking and journey planning for Antigua&apos;s public bus network. The public
              data is open — see the{' '}
              <span className="font-medium text-slate-600 dark:text-slate-300">Data</span> page to
              download or query it.
            </p>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Building on the original{' '}
              <ExternalLink
                href={OLD_SITE_URL}
                className="font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                busstopanu.com
              </ExternalLink>
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Powered by SpacetimeDB · Fares in EC$ · © {new Date().getFullYear()}</p>
          <p>
            See the{' '}
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#/about';
              }}
              className="font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
            >
              About
            </button>{' '}
            page to credit the original Bus Stop Antigua guide.
          </p>
        </div>
      </div>
    </footer>
  );
}

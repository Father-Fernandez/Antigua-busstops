export default function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="flex h-1.5 w-full" aria-hidden="true">
        <span className="flex-1 bg-flag-500" />
        <span className="flex-1 bg-white" />
        <span className="flex-1 bg-brand-500" />
        <span className="flex-1 bg-ink" />
        <span className="flex-1 bg-sun-500" />
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M4 16V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a1 1 0 0 1-1 1h-1v1.5a1.5 1.5 0 0 1-3 0V17H8v1.5a1.5 1.5 0 0 1-3 0V17H5a1 1 0 0 1-1-1Zm3-9h10v4H7V7Z" />
            </svg>
          </span>
          Bus Stop Antigua
        </p>
        <p className="text-xs text-slate-400">
          Powered by SpacetimeDB · Fares in EC$ · © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}

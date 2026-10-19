import LegacyLinks from './LegacyLinks';

const CONTACT_USER = 'the.1studioyo';
const CONTACT_DOMAIN = 'gmail.com';

interface Props {
  stopCount: number;
  routeCount: number;
}

export default function AboutView({ stopCount, routeCount }: Props) {
  const stats = [
    { label: 'Stops', value: stopCount },
    { label: 'Routes', value: routeCount },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map(s => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-3xl font-extrabold text-brand-600 dark:text-brand-400">{s.value}</p>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="max-w-none rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">About this service</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Bus Stop Antigua is your one stop shop for knowing how to get around the Beautiful Nation of Antigua via the Bus system,
          showing it with a much more intuitive U.I, it is powered by SpacetimeDB
          (which may be overkill, but i wanted to try it).
        </p>

        <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Open data
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Routes, stops and fares are public and read-only. Anyone can download them or query the
          live database directly, visit the{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">Data</span> page for
          exports and connection details. Editing is restricted to me and anyone that asks nicely
        </p>

        <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Fares
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Fares are a flat rate per route, shown in Eastern Caribbean dollars (EC$). Adult, child
          and night rates are listed on each route.
        </p>

        <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Coverage
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Most of the information on this page may either be wrong or outdated. If there&apos;s
          anything you&apos;d like corrected, or a feature you&apos;d like to see, please{' '}
          <a
            href={`mailto:${CONTACT_USER}@${CONTACT_DOMAIN}?subject=${encodeURIComponent('Bus Stop Antigua')}`}
            className="font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            {`${CONTACT_USER}@${CONTACT_DOMAIN}`}
          </a>
          .
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          From the original Bus Stop Antigua
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          The island&apos;s go-to bus guide since 2014 — every link opens in a new tab.
        </p>
        <div className="mt-5">
          <LegacyLinks />
        </div>
      </div>
    </div>
  );
}

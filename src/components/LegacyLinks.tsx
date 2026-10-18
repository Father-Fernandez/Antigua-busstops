import type { ReactNode } from 'react';
import { LEGACY_LINKS, LEGACY_SOCIAL, OLD_SITE_URL } from '../lib/links';

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current opacity-60" aria-hidden="true">
      <path d="M14 3h7v7h-2V6.4l-7.3 7.3-1.4-1.4L17.6 5H14V3ZM5 5h6v2H6v11h11v-5h2v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export function ExternalLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 ${className}`}
    >
      {children}
      <ExternalIcon />
    </a>
  );
}

export default function LegacyLinks() {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-sun-200 bg-sun-50/70 px-5 py-4 dark:border-sun-500/25 dark:bg-sun-500/10">
        <p className="text-sm text-slate-700 dark:text-slate-200">
          This project builds on the original{' '}
          <ExternalLink
            href={OLD_SITE_URL}
            className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800 dark:text-brand-300"
          >
            Bus Stop Antigua
          </ExternalLink>
          , which has been the island&apos;s reference bus guide since 2014. Its pages open in a new
          tab, so you can dip into the original guide without losing your place here.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LEGACY_LINKS.map(link => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-700"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
              <ExternalIcon />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1 font-semibold text-slate-800 group-hover:text-brand-700 dark:text-slate-100 dark:group-hover:text-brand-300">
                {link.label}
              </span>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                {link.description}
              </span>
            </span>
          </a>
        ))}
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Follow the original guide on{' '}
        {LEGACY_SOCIAL.map((social, i) => (
          <span key={social.href}>
            {i > 0 && ' · '}
            <ExternalLink
              href={social.href}
              className="font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              {social.label}
            </ExternalLink>
          </span>
        ))}
        .
      </p>
    </div>
  );
}

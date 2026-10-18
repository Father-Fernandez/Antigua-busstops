import { useEffect, useState } from 'react';

/** Every top-level view in the app, addressable as `#/<page>`. */
export const PAGES = [
  'planner',
  'map',
  'explore',
  'routes',
  'stops',
  'data',
  'admin',
  'about',
] as const;

export type Page = (typeof PAGES)[number];

export function isPage(value: string): value is Page {
  return (PAGES as readonly string[]).includes(value);
}

export interface RouteState {
  page: Page;
  params: URLSearchParams;
}

function parseHash(): RouteState {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [path = '', query = ''] = raw.split('?');
  return {
    page: isPage(path) ? path : 'planner',
    params: new URLSearchParams(query),
  };
}

/** Current page + query params, kept in sync with the URL hash (back/forward work). */
export function useHashRoute(): RouteState {
  const [state, setState] = useState<RouteState>(parseHash);

  useEffect(() => {
    const onChange = () => setState(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return state;
}

/** Navigate to a page, optionally with query params (e.g. a shared journey). */
export function navigate(page: Page, params?: Record<string, string>): void {
  const query = params && Object.keys(params).length ? `?${new URLSearchParams(params)}` : '';
  const next = `#/${page}${query}`;
  if (window.location.hash !== next) window.location.hash = next;
}

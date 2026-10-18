// Resolved SpacetimeDB target. Runtime config (injected by the container) wins
// over build-time env vars, which fall back to the public Maincloud defaults.
export const SPACETIMEDB_HOST =
  window.__ENV__?.VITE_SPACETIMEDB_HOST ||
  import.meta.env.VITE_SPACETIMEDB_HOST ||
  'wss://maincloud.spacetimedb.com';

export const SPACETIMEDB_DB_NAME =
  window.__ENV__?.VITE_SPACETIMEDB_DB_NAME ||
  import.meta.env.VITE_SPACETIMEDB_DB_NAME ||
  'bus-system-qcj1z';

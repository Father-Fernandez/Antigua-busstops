/// <reference types="vite/client" />

interface Window {
  /** Runtime config injected by the container (see public/config.js). */
  __ENV__?: {
    VITE_SPACETIMEDB_HOST?: string;
    VITE_SPACETIMEDB_DB_NAME?: string;
  };
}

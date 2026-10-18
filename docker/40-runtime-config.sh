#!/bin/sh
set -eu

# Regenerate the runtime config from container environment variables so the same
# image can point at any SpacetimeDB instance without a rebuild.
cat > /usr/share/nginx/html/config.js <<EOF
window.__ENV__ = {
  VITE_SPACETIMEDB_HOST: "${SPACETIMEDB_HOST:-}",
  VITE_SPACETIMEDB_DB_NAME: "${SPACETIMEDB_DB_NAME:-}"
};
EOF

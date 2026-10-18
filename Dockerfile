# syntax=docker/dockerfile:1

# ---- Stage 1: build the static client ----
FROM node:24-alpine AS build
WORKDIR /app

# Install dependencies first (cached unless the manifest changes).
COPY package.json package-lock.json ./
RUN npm ci

# Build the client. VITE_* vars baked here are only fallbacks; the container
# injects the real SpacetimeDB target at runtime (see docker/ nginx entrypoint).
COPY . .
RUN npm run build

# ---- Stage 2: serve the static build ----
FROM nginx:alpine AS runtime

# SpacetimeDB endpoint baked into the served app; override at run time with
# `docker run -e SPACETIMEDB_HOST=... -e SPACETIMEDB_DB_NAME=...`.
ENV SPACETIMEDB_HOST=wss://maincloud.spacetimedb.com \
    SPACETIMEDB_DB_NAME=bus-system-qcj1z

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]

// Runtime configuration. The Docker image regenerates this file at container
// startup (see docker/40-runtime-config.sh) so one image can target any
// SpacetimeDB instance without a rebuild. These are the local dev defaults.
window.__ENV__ = window.__ENV__ || {};

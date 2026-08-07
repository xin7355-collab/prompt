/**
 * Extends app.json. Everything static lives there; this file only injects the values
 * that have to vary per build.
 *
 * `baseUrl` matters for GitHub Pages, which serves a project site from /<repo>/ rather
 * than the domain root. Without it every asset URL and every route would be resolved
 * against `/` and 404. Left unset for local dev and the single-file build, both of
 * which run at the root.
 */
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.EXPO_BASE_URL || undefined,
  },
});

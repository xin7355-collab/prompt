/*
 * Service worker for 咒語盒 Spellbox.
 *
 * The two placeholders below are rewritten by tools/pwa-postbuild.mjs once the export
 * exists and the hashed bundle filename is known. The defaults are deliberately valid:
 * if the post-build step is skipped the worker still installs and still works, it just
 * caches lazily on first visit instead of precaching the shell up front.
 */
const VERSION = '__BUILD_VERSION__';
const PRECACHE = [];

const CACHE = 'spellbox-' + VERSION;

/** Everything the app is built from lives under the worker's own scope. */
const scopeUrl = new URL(self.registration.scope);

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // addAll rejects the whole install if any single entry 404s, which would leave
      // the app with no worker at all; cache entries individually instead.
      await Promise.all(
        PRECACHE.map((path) =>
          cache.add(new Request(path, { cache: 'reload' })).catch(() => {})
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n.startsWith('spellbox-') && n !== CACHE).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

/** Lets the page trigger an immediate update instead of waiting for the next launch. */
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== scopeUrl.origin) return;

  // Navigations: the app is a single-page build, so any in-app route must resolve to
  // the shell. Network first so a fresh deploy is picked up, cache as the offline path.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put(scopeUrl.pathname, fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(CACHE);
          return (
            (await cache.match(scopeUrl.pathname)) ||
            (await cache.match('./')) ||
            Response.error()
          );
        }
      })()
    );
    return;
  }

  // Static assets are content-hashed, so a cache hit is always the right answer.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(request);
      if (hit) return hit;
      try {
        const fresh = await fetch(request);
        if (fresh.ok) cache.put(request, fresh.clone());
        return fresh;
      } catch {
        return hit || Response.error();
      }
    })()
  );
});

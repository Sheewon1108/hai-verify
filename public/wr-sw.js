// Copyright 2026 KARAM. All Rights Reserved.
// WR private rooms service worker — installability + offline shell only.
// SECURITY: never cache room data. /api/wr/* and all API traffic bypass the
// cache entirely so no entry contents are persisted to disk on any device.

const CACHE = "wr-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add("/wr")));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never touch the cache for API traffic — room entries stay memory-only.
  if (url.pathname.startsWith("/api/")) return;

  // Network-first for the app shell + static assets; fall back to cache offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((hit) => hit ?? caches.match("/wr"))),
  );
});

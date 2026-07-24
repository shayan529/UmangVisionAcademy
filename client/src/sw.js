import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

// Cleanup old caches
cleanupOutdatedCaches();

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST || []);

const ASSETS_CACHE_NAME = "umang-assets-cache-v2";

// ── Service Worker Activation: Purge Old Video Caches ──────────────────────
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.includes("video") || cacheName === "umang-video-cache-v1") {
            console.log("[SW] Purging video cache:", cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ── Silent Images & Fonts Caching ─────────────────────────────────────────
// Note: Video requests and Vercel Blob URLs are explicitly excluded so the browser's
// native media engine handles Range requests directly over HTTP without SW interception.
registerRoute(
  ({ request, url }) => {
    if (
      url.hostname.includes("vercel-storage.com") ||
      request.destination === "video" ||
      url.pathname.endsWith(".mp4") ||
      url.pathname.endsWith(".webm") ||
      url.pathname.endsWith(".m3u8") ||
      url.pathname.endsWith(".ts")
    ) {
      return false;
    }
    return request.destination === "image" || request.destination === "font";
  },
  new StaleWhileRevalidate({
    cacheName: ASSETS_CACHE_NAME,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 80,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { RangeRequestsPlugin } from "workbox-range-requests";
import { ExpirationPlugin } from "workbox-expiration";

// Cleanup old caches
cleanupOutdatedCaches();

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST || []);

const VIDEO_CACHE_NAME = "umang-video-cache-v1";
const ASSETS_CACHE_NAME = "umang-assets-cache-v1";

// ── Silent Automatic Video Caching Route ─────────────────────────────────
// Automatically caches video streams as the student plays them, enabling
// seamless offline playback if connection is lost.
registerRoute(
  ({ request, url }) => {
    return (
      request.destination === "video" ||
      url.pathname.endsWith(".mp4") ||
      url.pathname.endsWith(".webm") ||
      url.pathname.endsWith(".m3u8") ||
      url.pathname.endsWith(".ts") ||
      url.pathname.includes("/uploads/videos") ||
      (url.hostname.includes("imagekit.io") && request.destination === "video")
    );
  },
  new CacheFirst({
    cacheName: VIDEO_CACHE_NAME,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200, 206], // 206 for video chunk range requests
      }),
      new RangeRequestsPlugin(), // Enables HTML5 video playback & seeking from cache
      new ExpirationPlugin({
        maxEntries: 40,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// ── Silent Images & Fonts Caching ─────────────────────────────────────────
registerRoute(
  ({ request }) =>
    request.destination === "image" || request.destination === "font",
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

// Service Worker activation and claim
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

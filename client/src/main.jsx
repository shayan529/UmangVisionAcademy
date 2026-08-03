import "./config/api.js";
import { StrictMode, Suspense } from "react";

// Automatically reload the page when a lazy chunk load fails due to a new deployment.
// This is a last-resort handler for errors that escape the React ErrorBoundary.
// ErrorBoundary.jsx handles the primary case with loop-prevention via sessionStorage.
if (typeof window !== "undefined") {
  const CHUNK_RELOAD_KEY = "chunk_reload_attempted";

  const isChunkMsg = (msg = "") =>
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("error loading dynamically imported module");

  const safeReload = () => {
    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return; // already reloaded once
      sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    } catch { /* ignore */ }
    window.location.reload();
  };

  window.addEventListener("error", (e) => {
    if (e.message && isChunkMsg(e.message)) {
      console.warn("Chunk load error detected (global), reloading…");
      safeReload();
    }
  }, true);

  window.addEventListener("unhandledrejection", (e) => {
    if (isChunkMsg(e.reason?.message || "")) {
      console.warn("Chunk load rejection detected (global), reloading…");
      safeReload();
    }
  });
}
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./redux/store.js";
import "./i18n/index.js";
import { HelmetProvider } from "react-helmet-async";
import { registerSW } from "virtual:pwa-register";

import MobileAppListener from "./components/common/MobileAppListener.jsx";

if (import.meta.env.DEV && "serviceWorker" in navigator) {
  // Clear any active Service Worker and Cache Storage in dev mode so localhost uses fresh server data
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
  if ("caches" in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
} else if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  registerSW({ immediate: true });
}

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <HelmetProvider>
      <BrowserRouter>
        <MobileAppListener />
        <Suspense
          fallback={
            <div className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none">
              <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 animate-pulse" />
            </div>
          }
        >
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </Suspense>
        <Toaster
          containerStyle={{
            top: 70,
            zIndex: 999999,
          }}
          toastOptions={{
            duration: 4000,
          }}
        />
      </BrowserRouter>
    </HelmetProvider>
  </Provider>,
);

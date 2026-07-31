import "./config/api.js";
import { StrictMode, Suspense } from "react";

// Automatically reload the page when a lazy chunk load fails due to a new deployment
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    if (e.message && (
      e.message.includes("Failed to fetch dynamically imported module") ||
      e.message.includes("error loading dynamically imported module")
    )) {
      console.warn("Chunk load error detected, reloading page to fetch latest version...");
      window.location.reload();
    }
  }, true);

  window.addEventListener("unhandledrejection", (e) => {
    const message = e.reason?.message || "";
    if (
      message.includes("Failed to fetch dynamically imported module") ||
      message.includes("error loading dynamically imported module")
    ) {
      console.warn("Chunk load promise rejection detected, reloading page...");
      window.location.reload();
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
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#0b1120] text-slate-400">
              <div className="w-12 h-12 border-4 border-slate-800 border-t-cyan-400 rounded-full animate-spin" />
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

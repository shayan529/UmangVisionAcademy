import "./config/api.js";
import { StrictMode } from "react";

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
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./redux/store.js";
import "./i18n/index.js";
createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
      <Toaster
        containerStyle={{
          top: 70,
        }}
        toastOptions={{
          duration: 4000,
        }}
      />
    </BrowserRouter>
  </Provider>,
);

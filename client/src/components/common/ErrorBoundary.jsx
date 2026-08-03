import React from "react";

// ── Chunk-load error detection ────────────────────────────────────────────────
// When Vite/Rollup redeploys, previously-cached HTML references old JS chunk
// hashes. Navigating to a lazy route fetches the old URL, gets a 404 HTML
// response, and React throws a "Failed to fetch dynamically imported module"
// error. We detect this and reload once — a sessionStorage flag prevents loops.

const CHUNK_RELOAD_KEY = "chunk_reload_attempted";

export function isChunkLoadError(error) {
  const msg = error?.message ?? String(error ?? "");
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("error loading dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("Unable to preload CSS for") ||
    // Vite dev-mode variant
    (msg.includes("Failed to load") && msg.includes("module"))
  );
}

function reloadForChunkError() {
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
      // Already reloaded once — don't loop. Fall through to error UI.
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  } catch {
    // sessionStorage unavailable — reload anyway (risk is acceptable)
  }
  window.location.reload();
  return true;
}

// Clear the reload-guard on every successful page load so that subsequent
// deploys can still trigger a reload.
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch { /* ignore */ }
  });
}

// ── ErrorBoundary component ───────────────────────────────────────────────────

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, reloading: false };
  }

  static getDerivedStateFromError(error) {
    // If this is a chunk-load error, signal that we're about to reload.
    if (isChunkLoadError(error)) {
      const willReload = !sessionStorage.getItem(CHUNK_RELOAD_KEY);
      return { hasError: true, error, reloading: willReload };
    }
    return { hasError: true, error, reloading: false };
  }

  componentDidCatch(error, errorInfo) {
    if (isChunkLoadError(error)) {
      // Attempt an automatic reload to fetch the latest deployment chunks.
      reloadForChunkError();
      return;
    }
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReload = () => {
    // Manual reload — clear guard so future chunk errors can still auto-reload.
    try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch { /* ignore */ }
    this.setState({ hasError: false, error: null, reloading: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // While reloading show a minimal spinner rather than an error flash.
      if (this.state.reloading) {
        return (
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#020817",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "3px solid #1e293b",
                  borderTopColor: "#7c3aed",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 16px",
                }}
              />
              <p style={{ color: "#64748b", fontSize: 14 }}>
                Updating to latest version…
              </p>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-[#020817] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-slate-400 text-sm mb-6">
              An unexpected error occurred. Please reload the page to continue.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

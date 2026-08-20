import React, { useState } from "react";
import {
  RotateCcw,
  Home,
  ArrowLeft,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  LifeBuoy,
  Sparkles,
} from "lucide-react";

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
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    } catch {
      /* ignore */
    }
  });
}

// ── Functional Fallback UI ───────────────────────────────────────────────────

function ErrorFallbackView({ error, onReload }) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const errorMessage = error?.message || "An unknown runtime error occurred.";
  const errorStack = error?.stack || "";

  const handleCopyDetails = async () => {
    const errorPayload = `Error: ${errorMessage}\n\nLocation: ${window.location.href}\nTimestamp: ${new Date().toISOString()}\nUser Agent: ${navigator.userAgent}\n\nStack Trace:\n${errorStack}`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(errorPayload);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = errorPayload;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy error details:", err);
    }
  };

  const handleReloadClick = () => {
    setIsReloading(true);
    onReload();
  };

  const handleGoHome = () => {
    window.location.href = "/";
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* Decorative ambient background mesh */}
      <div className="absolute top-1/4 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-80 sm:w-96 h-80 sm:h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      {/* Main Glass Card */}
      <div className="relative max-w-lg w-full bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl text-center overflow-hidden z-10 transition-all">
        {/* Top subtle gradient highlight bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500" />

        {/* Animated Badge & Icon */}
        <div className="relative mx-auto mb-6 w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-rose-500/20 via-amber-500/15 to-indigo-500/20 blur-md" />
          <div className="relative w-20 h-20 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-center shadow-inner">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-900/30 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-7 h-7 text-rose-400 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Status Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-rose-500/10 border border-rose-500/20 text-rose-300 mb-3.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
          Unexpected Error
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2.5">
          Something went wrong
        </h1>

        {/* Description */}
        <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-md mx-auto">
          We encountered an unexpected glitch while loading this page. Your
          account and data remain completely safe.
        </p>

        {/* Primary and Secondary Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button
            onClick={handleReloadClick}
            disabled={isReloading}
            className="flex-1 inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] text-white text-sm font-bold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all cursor-pointer disabled:opacity-75"
          >
            <RotateCcw
              className={`w-4 h-4 ${isReloading ? "animate-spin" : ""}`}
            />
            {isReloading ? "Reloading..." : "Reload Page"}
          </button>

          <button
            onClick={handleGoHome}
            className="flex-1 inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 active:scale-[0.98] text-slate-200 hover:text-white border border-slate-700/80 text-sm font-semibold transition-all cursor-pointer hover:border-slate-600 shadow-sm"
          >
            <Home className="w-4 h-4 text-slate-400" />
            Go to Home
          </button>
        </div>

        {/* Additional Navigation Links */}
        <div className="flex items-center justify-center gap-4 text-xs text-slate-400 mb-6">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center gap-1.5 hover:text-indigo-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to previous page
          </button>
          <span className="text-slate-600">•</span>
          <a
            href="/contact"
            className="inline-flex items-center gap-1.5 hover:text-indigo-300 transition-colors"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            Contact Support
          </a>
        </div>

        {/* Collapsible Error Diagnostics */}
        <div className="border-t border-slate-800/80 pt-4 text-left">
          <button
            onClick={() => setShowDetails((prev) => !prev)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              Technical Error Details
            </span>
            {showDetails ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showDetails && (
            <div className="mt-3 p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/90 font-mono text-left animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 truncate">
                  {error?.name || "Runtime Error"}
                </span>
                <button
                  onClick={handleCopyDetails}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-sans font-medium transition cursor-pointer shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Copy Details</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs text-rose-300 font-medium break-words mb-2">
                {errorMessage}
              </div>

              {errorStack && (
                <div className="max-h-32 overflow-y-auto text-[10.5px] text-slate-400 leading-relaxed font-mono whitespace-pre-wrap select-text pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                  {errorStack}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Updating to Latest Version (Chunk Reload) UI ─────────────────────────────

function ReloadingView() {
  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-sm w-full bg-slate-900/85 border border-slate-800/90 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl text-center">
        <div className="relative mx-auto mb-6 w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 blur-md animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-slate-950 border border-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-indigo-400 animate-spin" style={{ animationDuration: "3s" }} />
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          Updating Application
        </h2>
        <p className="text-slate-400 text-xs leading-relaxed mb-6">
          Fetching the latest features and updates, just a moment…
        </p>

        <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 h-1.5 rounded-full w-2/3 animate-pulse" />
        </div>
      </div>
    </div>
  );
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
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    } catch {
      /* ignore */
    }
    this.setState({ hasError: false, error: null, reloading: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.state.reloading) {
        return <ReloadingView />;
      }

      return (
        <ErrorFallbackView
          error={this.state.error}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

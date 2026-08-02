import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Network } from "@capacitor/network";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import toast from "react-hot-toast";
import { SOCKET_URL } from "../../config/api.js";

export default function MobileAppListener() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only activate native Capacitor listeners if running on a native platform or mobile web
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // 1. Notify Capgo OTA updater that the bundle loaded successfully (prevents auto-rollback)
    CapacitorUpdater.notifyAppReady().catch((err) => {
      console.warn("CapacitorUpdater notifyAppReady skipped:", err?.message || err);
    });

    // 2. Handle Android Hardware Back Button
    const backButtonListener = App.addListener("backButton", ({ canGoBack }) => {
      const topLevelRoutes = [
        "/",
        "/student-dashboard",
        "/instructor-dashboard",
        "/admin-dashboard",
        "/staff-dashboard",
        "/login",
      ];

      const currentPath = window.location.pathname;
      if (topLevelRoutes.includes(currentPath) || !canGoBack) {
        App.exitApp();
      } else {
        navigate(-1);
      }
    });

    // 3. Handle App State (Background / Resume Lifecycle)
    const appStateListener = App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) {
        // App resumed from background: notify active listeners or socket handlers
        window.dispatchEvent(new CustomEvent("app-resume", { detail: { SOCKET_URL } }));
      }
    });

    // 4. Handle Network Connectivity Status Change
    let networkListener;
    Network.addListener("networkStatusChange", (status) => {
      if (!status.connected) {
        toast.error("You are offline. Please check your internet connection.", {
          id: "offline-toast",
          duration: 5000,
        });
      } else {
        toast.success("Back online!", { id: "online-toast", duration: 3000 });
        window.dispatchEvent(new CustomEvent("app-online", { detail: { SOCKET_URL } }));
      }
    }).then((listener) => {
      networkListener = listener;
    });

    return () => {
      backButtonListener.then((l) => l.remove());
      appStateListener.then((l) => l.remove());
      if (networkListener) {
        networkListener.remove();
      }
    };
  }, [navigate, location.pathname]);

  return null;
}

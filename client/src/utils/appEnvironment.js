export const isNativeApp = () => {
  if (typeof window === "undefined") return false;
  const userAgent = window.navigator?.userAgent || "";
  return !!(
    window.Capacitor ||
    window.Capacitor?.isNativePlatform ||
    userAgent.includes("Capacitor") ||
    userAgent.includes("Ionic")
  );
};

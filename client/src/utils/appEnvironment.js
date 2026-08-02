import { Capacitor } from "@capacitor/core";

export const isNativeApp = () => {
  if (typeof window === "undefined") return false;
  return Capacitor.isNativePlatform();
};

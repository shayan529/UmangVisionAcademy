import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// ── Language bundle loading ───────────────────────────────────────────────────
// English is the fallback language and is always needed, so we import it
// statically — it will be part of the main JS bundle and is available
// immediately with zero extra network round-trips.
//
// Hindi (and any future language) is imported dynamically. The browser will
// only download that ~40 kB JSON file when:
//   a) the user's stored preference (localStorage) is "hi", OR
//   b) the browser's navigator.language starts with "hi".
// For the ~majority of users whose language is English the file is never
// fetched at all, saving bandwidth and parse time on every page load.

import en from "./locales/en/translation.json";

// Detect the preferred language BEFORE initialising i18next so we can decide
// whether to pre-fetch Hindi. We replicate the detector's priority order:
// localStorage → navigator.language.
const getPreferredLang = () => {
  try {
    const stored = localStorage.getItem("i18nextLng");
    if (stored) return stored.split("-")[0]; // e.g. "hi-IN" → "hi"
  } catch {
    // localStorage not available (SSR / privacy mode)
  }
  return (navigator?.language || "en").split("-")[0];
};

const preferredLang = getPreferredLang();

// Build the resources object. English is always included.
// Hindi is added synchronously only when it is the preferred language,
// otherwise it is lazy-loaded after init via i18n.addResourceBundle().
const resources = {
  en: { translation: en },
};

// Kick off the Hindi bundle fetch in the background (non-blocking).
// – If Hindi is preferred we await it so the first render is already
//   translated, avoiding an English flash.
// – If English is preferred we still pre-fetch Hindi quietly so switching
//   languages later feels instant (no spinner).
const loadHindi = () =>
  import("./locales/hi/translation.json").then((mod) => {
    const hiTranslation = mod.default ?? mod;
    if (!i18n.hasResourceBundle("hi", "translation")) {
      i18n.addResourceBundle("hi", "translation", hiTranslation, true, true);
    }
  });

// Initialise i18next. When the user is already on Hindi we wait for the
// bundle so they never see an English flash; otherwise we init immediately
// with English only and let Hindi load in the background.
const initI18n = async () => {
  if (preferredLang === "hi") {
    // Load Hindi bundle first so the initial render is in Hindi
    try {
      const mod = await import("./locales/hi/translation.json");
      resources.hi = { translation: mod.default ?? mod };
    } catch {
      // If loading fails, fall back to English silently
    }
  }

  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: "en",
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
      },
      react: { useSuspense: true },
    });

  // After init, silently pre-fetch Hindi if it wasn't loaded yet so that
  // language switching is instant for any user.
  if (preferredLang !== "hi") {
    loadHindi().catch(() => {});
  }
};

initI18n().catch(console.error);

export default i18n;

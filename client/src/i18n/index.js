import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en/translation.json";

// Lazy loaders for non-English translation dictionaries (saves ~1.2MB upfront)
const languageLoaders = {
  hi: () => import("./locales/hi/translation.json"),
  mr: () => import("./locales/mr/translation.json"),
  gu: () => import("./locales/gu/translation.json"),
  bn: () => import("./locales/bn/translation.json"),
  ta: () => import("./locales/ta/translation.json"),
  te: () => import("./locales/te/translation.json"),
};

export const loadLanguageResource = async (lng) => {
  if (!lng) return;
  const code = lng.split("-")[0].toLowerCase();
  if (code === "en" || i18n.hasResourceBundle(code, "translation")) {
    return;
  }
  const loader = languageLoaders[code];
  if (loader) {
    try {
      const module = await loader();
      if (module && module.default) {
        i18n.addResourceBundle(code, "translation", module.default, true, true);
      }
    } catch (err) {
      console.warn(`Failed to lazy load translation for "${code}":`, err);
    }
  }
};

// Wrap changeLanguage so changing language automatically loads the dictionary first
const originalChangeLanguage = i18n.changeLanguage.bind(i18n);
i18n.changeLanguage = async (lng, ...args) => {
  await loadLanguageResource(lng);
  return originalChangeLanguage(lng, ...args);
};

const savedLang =
  typeof localStorage !== "undefined"
    ? localStorage.getItem("i18nextLng") || "en"
    : "en";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
    },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    react: { useSuspense: false },
  });

// Pre-load saved language if not English
if (savedLang && savedLang !== "en") {
  const code = savedLang.split("-")[0].toLowerCase();
  if (code !== "en") {
    loadLanguageResource(code).then(() => {
      if (i18n.language !== code) {
        originalChangeLanguage(code);
      }
    });
  }
}

export default i18n;

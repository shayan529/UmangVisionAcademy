import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import api, { API_BASE_URL } from "../config/api";

const CACHE_KEY = "ai_hindi_translation_cache_v2";

// Load cache from localStorage
const loadCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

// Save cache to localStorage
const saveCache = (cache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore storage quota errors */
  }
};

let inMemoryCache = loadCache();

/**
 * Direct async translation function for arrays of text strings
 */
export async function batchTranslateTexts(texts = [], targetLang = "Hindi") {
  if (!Array.isArray(texts) || !texts.length) return {};

  const cleanTexts = [...new Set(texts.map((t) => String(t ?? "").trim()).filter(Boolean))];
  if (!cleanTexts.length) return {};

  const result = {};
  const missing = [];

  // Check cache first
  cleanTexts.forEach((text) => {
    if (inMemoryCache[text]) {
      result[text] = inMemoryCache[text];
    } else {
      missing.push(text);
    }
  });

  if (!missing.length) {
    return result;
  }

  try {
    let resData;
    try {
      const res = await api.post("/ai/translate", { texts: missing, targetLang });
      resData = res.data;
    } catch {
      // Fallback direct fetch if api axios instance isn't authenticated yet
      const rawRes = await fetch(`${API_BASE_URL}/ai/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: missing, targetLang }),
      });
      resData = await rawRes.json();
    }

    const newTranslations = resData?.translations || {};
    Object.assign(inMemoryCache, newTranslations);
    saveCache(inMemoryCache);

    cleanTexts.forEach((text) => {
      result[text] = inMemoryCache[text] || text;
    });
  } catch (err) {
    console.error("Batch translate error:", err);
    missing.forEach((text) => {
      result[text] = text;
    });
  }

  return result;
}

/**
 * Custom React Hook to translate text(s) when Hindi language is selected
 */
export function useAiTranslation(textsOrText) {
  const { i18n } = useTranslation();
  const isHindi = i18n.language === "hi";

  const textList = useMemo(() => {
    if (!textsOrText) return [];
    if (Array.isArray(textsOrText)) {
      return textsOrText.map((t) => String(t ?? "").trim()).filter(Boolean);
    }
    return [String(textsOrText).trim()].filter(Boolean);
  }, [JSON.stringify(textsOrText)]);

  const [translationMap, setTranslationMap] = useState(() => {
    const initialMap = {};
    textList.forEach((t) => {
      if (inMemoryCache[t]) initialMap[t] = inMemoryCache[t];
    });
    return initialMap;
  });

  useEffect(() => {
    if (!isHindi || !textList.length) return;

    let mounted = true;
    const missing = textList.filter((t) => !inMemoryCache[t]);

    if (!missing.length) {
      const updated = {};
      textList.forEach((t) => {
        updated[t] = inMemoryCache[t] || t;
      });
      setTranslationMap(updated);
      return;
    }

    batchTranslateTexts(missing, "Hindi").then((res) => {
      if (!mounted) return;
      const fullMap = {};
      textList.forEach((t) => {
        fullMap[t] = inMemoryCache[t] || res[t] || t;
      });
      setTranslationMap(fullMap);
    });

    return () => {
      mounted = false;
    };
  }, [isHindi, textList]);

  const tText = useCallback(
    (original) => {
      if (!isHindi || !original) return original;
      const trimmed = String(original).trim();
      return translationMap[trimmed] || inMemoryCache[trimmed] || original;
    },
    [isHindi, translationMap]
  );

  return { tText, translationMap, isHindi };
}

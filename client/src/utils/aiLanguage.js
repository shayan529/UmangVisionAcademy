/**
 * Maps locale code (e.g. 'en', 'hi', 'mr', 'gu', 'bn', 'ta', 'te')
 * to its human-readable language name for AI system prompts.
 */
export const getAiLanguageName = (langCode) => {
  if (!langCode) return 'English';
  const code = String(langCode).trim().toLowerCase();
  if (code.startsWith('hi') || code.includes('hindi')) return 'Hindi';
  if (code.startsWith('mr') || code.includes('marathi')) return 'Marathi';
  if (code.startsWith('gu') || code.includes('gujarati')) return 'Gujarati';
  if (code.startsWith('bn') || code.includes('bengali')) return 'Bengali';
  if (code.startsWith('ta') || code.includes('tamil')) return 'Tamil';
  if (code.startsWith('te') || code.includes('telugu')) return 'Telugu';
  return 'English';
};

/**
 * Determines Web Speech API (SpeechSynthesis) voice language tag
 * based on Indian script character ranges in the response text or active app locale.
 */
export const getTtsLanguageCode = (text, currentLangCode) => {
  if (text) {
    if (/[\u0900-\u097F]/.test(text)) {
      if (currentLangCode?.startsWith('mr')) return 'mr-IN';
      return 'hi-IN';
    }
    if (/[\u0A80-\u0AFF]/.test(text)) return 'gu-IN';
    if (/[\u0980-\u09FF]/.test(text)) return 'bn-IN';
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN';
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN';
  }

  const codeMap = {
    hi: 'hi-IN',
    mr: 'mr-IN',
    gu: 'gu-IN',
    bn: 'bn-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    en: 'en-US',
  };
  const prefix = String(currentLangCode || 'en').split('-')[0].toLowerCase();
  return codeMap[prefix] || 'en-US';
};

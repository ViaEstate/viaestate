// Client-side translation utilities for property cards
// Uses browser APIs and Google Translate as fallback

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

// Translation cache to avoid redundant requests
const translationCache = new Map<string, string>();

// Rate limiting to prevent API overload
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

// Simple language detection (client-side)
export function detectLanguage(text: string): string {
  if (!text || text.trim().length === 0) return 'en';

  const lowerText = text.toLowerCase();

  // Spanish indicators
  if (/\b(en|el|la|los|las|un|una|es|son|está|hay)\b/.test(lowerText) ||
      /[áéíóúüñ¿¡]/.test(lowerText)) {
    return 'es';
  }

  // French indicators
  if (/\b(le|la|les|et|est|dans|pour|avec|sur|une|des)\b/.test(lowerText) ||
      /[àâäéèêëïîôöùûüÿçœ]/.test(lowerText)) {
    return 'fr';
  }

  // German indicators
  if (/\b(der|die|das|und|ist|in|für|mit|auf|eine|ein)\b/.test(lowerText) ||
      /[äöüß]/.test(lowerText)) {
    return 'de';
  }

  // Swedish indicators
  if (/\b(och|är|i|att|en|det|på|för|med|som|till)\b/.test(lowerText) ||
      /[åäö]/.test(lowerText)) {
    return 'sv';
  }

  // Italian indicators
  if (/\b(il|lo|la|i|gli|le|un|una|uno|e|è|di|in|con|per|da)\b/.test(lowerText) ||
      /[àèéìíîòóùú]/.test(lowerText)) {
    return 'it';
  }

  // Croatian indicators
  if (/\b(na|u|je|sa|za|iz|od|do|li|se|ne|da|kad|ako)\b/.test(lowerText) ||
      /[čćđšž]/.test(lowerText)) {
    return 'hr';
  }

  // Norwegian indicators
  if (/\b(og|er|i|å|en|det|på|for|med|som|til)\b/.test(lowerText) ||
      /[æøå]/.test(lowerText)) {
    return 'nb';
  }

  // Danish indicators
  if (/\b(og|er|i|at|en|det|på|for|med|som|til)\b/.test(lowerText) ||
      /[æøå]/.test(lowerText)) {
    return 'da';
  }

  // Finnish indicators
  if (/\b(ja|on|in|että|se|ei|ole|me|sinä|hän|he)\b/.test(lowerText) ||
      /[åäö]/.test(lowerText)) {
    return 'fi';
  }

  // Hungarian indicators (for completeness)
  if (/\b(a|az|és|vagy|van|volt|lesz|leszek|leszel|leszünk|lesztek|lesznek| vagyok|vagyok|van|voltam|voltál|voltunk|voltatok|voltak|leszek|leszel|lesz|leszünk|lesztek|lesznek)\b/.test(lowerText) ||
      /[őűáéíóúöü]/.test(lowerText)) {
    return 'hu';
  }

  return 'en';
}

// Check if browser supports Translation API
export function supportsTranslationAPI(): boolean {
  return 'translation' in window && 'createTranslator' in (window as any).translation;
}

// Translate using browser Translation API
export async function translateWithBrowserAPI(text: string, fromLang: string, toLang: string = 'en'): Promise<string> {
  if (!supportsTranslationAPI() || fromLang === toLang) {
    return text;
  }

  try {
    const translator = await (window as any).translation.createTranslator({
      sourceLanguage: fromLang,
      targetLanguage: toLang,
    });

    const result = await translator.translate(text);
    return result;
  } catch (error) {
    console.warn('Browser Translation API failed:', error);
    return text;
  }
}

// Supported languages for LibreTranslate
const supportedLanguages = new Set(['en', 'es', 'fr', 'de', 'sv', 'it', 'hr', 'nb', 'da', 'fi']);

// Validate language code
function validateLanguage(lang: string): string {
  return supportedLanguages.has(lang.toLowerCase()) ? lang.toLowerCase() : 'en';
}

// LibreTranslate API
export async function translateWithLibreTranslate(text: string, fromLang: string, toLang: string = 'en'): Promise<string> {
  if (fromLang === toLang) {
    return text;
  }

  // Validate language parameters
  const validatedFrom = validateLanguage(fromLang);
  const validatedTo = validateLanguage(toLang);
  
  if (validatedFrom === validatedTo) {
    return text;
  }

  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();

  try {
    // Try the official LibreTranslate API endpoint
    const response = await fetch('https://api.libretranslate.com/v1/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LibreTranslate-API-Key': import.meta.env.VITE_LIBRETRANSLATE_API_KEY
      },
      body: JSON.stringify({
        q: text,
        source: validatedFrom,
        target: validatedTo,
        format: 'text'
      })
    });

    if (response.ok) {
      const result = await response.json();
      return result.translatedText;
    } else {
      console.warn('LibreTranslate API failed with status:', response.status, 'for text:', text.substring(0, 50));
      // Log response body for debugging
      const errorBody = await response.text();
      console.warn('LibreTranslate error response:', errorBody);
    }
  } catch (error) {
    console.warn('LibreTranslate API failed:', error);
  }

  // Fallback: return original text if translation fails
  return text;
}

// Google Translate API (requires API key)
export async function translateWithGoogleAPI(text: string, fromLang: string, apiKey: string, toLang: string = 'en'): Promise<string> {
  if (!apiKey || fromLang === toLang) {
    return text;
  }

  try {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: fromLang,
        target: toLang,
        format: 'text'
      })
    });

    if (response.ok) {
      const result = await response.json();
      return result.data.translations[0].translatedText;
    }
  } catch (error) {
    console.warn('Google Translate API failed:', error);
  }

  return text;
}

// Strip HTML tags from text
function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

// Main translation function with fallbacks
export async function translateText(text: string, options: {
  googleApiKey?: string;
  forceTranslation?: boolean;
  targetLang?: string;
} = {}): Promise<string> {
  const targetLang = options.targetLang || 'en';
  
  // Create cache key
  const cacheKey = `${text}-${targetLang}`;
  
  // Check cache first
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  if (!text || text.trim().length === 0) {
    return text;
  }

  // Strip HTML before processing
  const cleanText = stripHtml(text);

  const detectedLang = detectLanguage(cleanText);

  // If text is already in target language or user doesn't want forced translation, return as-is
  if (detectedLang === targetLang && !options.forceTranslation) {
    return cleanText;
  }

  // Try browser Translation API first
  if (supportsTranslationAPI()) {
    try {
      const browserResult = await translateWithBrowserAPI(cleanText, detectedLang, targetLang);
      if (browserResult !== cleanText) {
        translationCache.set(cacheKey, browserResult);
        return browserResult;
      }
    } catch (error) {
      console.error('clientTranslation: Browser API error:', error);
    }
  }

  // Try LibreTranslate API (free) - but limit requests
  try {
    const libreResult = await translateWithLibreTranslate(cleanText, detectedLang, targetLang);
    if (libreResult !== cleanText) {
      translationCache.set(cacheKey, libreResult);
      return libreResult;
    }
  } catch (error) {
    console.error('clientTranslation: LibreTranslate API error:', error);
  }

  // Try Google Translate API if key provided
  if (options.googleApiKey) {
    try {
      const googleResult = await translateWithGoogleAPI(cleanText, detectedLang, options.googleApiKey, targetLang);
      if (googleResult !== cleanText) {
        translationCache.set(cacheKey, googleResult);
        return googleResult;
      }
    } catch (error) {
      console.error('clientTranslation: Google API error:', error);
    }
  }

  // Fallback: return cleaned original text
  translationCache.set(cacheKey, cleanText);
  return cleanText;
}

// Hook for React components
export function useTranslation() {
  return {
    translateText,
    detectLanguage,
    supportsTranslationAPI: supportsTranslationAPI()
  };
}
import { detectLanguage as clientDetectLanguage } from '@/lib/clientTranslation';

// Supported languages for LibreTranslate
const supportedLanguages = new Set(['en', 'es', 'fr', 'de', 'sv', 'it', 'hr', 'nb', 'da', 'fi']);

// Validate language code
function validateLanguage(lang: string): string {
  return supportedLanguages.has(lang.toLowerCase()) ? lang.toLowerCase() : 'en';
}

// List of available translation endpoints with fallback support
const translationEndpoints = [
  // Primary LibreTranslate endpoint (recommended)
  {
    url: 'https://api.libretranslate.com/v1/translate',
    type: 'libretranslate'
  },
  // Alternative LibreTranslate endpoints (fallbacks)
  {
    url: 'https://libretranslate.de/v1/translate',
    type: 'libretranslate'
  },
  {
    url: 'https://translate.argosopentech.com/v1/translate',
    type: 'libretranslate'
  },
  {
    url: 'https://libretranslate.com/translate',
    type: 'libretranslate'
  }
];

/**
 * Detects the language of a given text using client-side heuristic detection
 */
export async function detectLanguage(text: string): Promise<string> {
  return clientDetectLanguage(text);
}

/**
 * Translates text using a specific LibreTranslate endpoint
 */
async function translateWithEndpoint(endpoint: { url: string; type: string }, text: string, sourceLang: string, targetLang: string, apiKey?: string): Promise<string | null> {
  try {
    const requestBody = {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text'
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (apiKey && apiKey !== 'your_libretranslate_api_key_here') {
      headers['X-LibreTranslate-API-Key'] = apiKey;
    }

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (response.ok) {
      const result = await response.json();
      return result.translatedText || null;
    } else {
      console.warn(`Endpoint ${endpoint.url} failed with status:`, response.status);
      const errorBody = await response.text();
      console.warn('Error response:', errorBody.substring(0, 200));
      return null;
    }
  } catch (error) {
    console.error(`Endpoint ${endpoint.url} failed:`, error);
    return null;
  }
}

/**
 * Translates text to English using LibreTranslate API with fallback endpoints
 */
export async function translateToEnglish(text: string, sourceLang?: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // If already English, return as-is
  if (sourceLang === 'en') {
    return text;
  }

  // Validate language parameters
  const validatedFrom = validateLanguage(sourceLang || 'auto');
  const validatedTo = 'en';
  
  if (validatedFrom === validatedTo) {
    return text;
  }

  // Get API key from environment variables
  const libreTranslateApiKey = import.meta.env.VITE_LIBRETRANSLATE_API_KEY;

  // Check if API key is configured
  const isApiKeyConfigured = libreTranslateApiKey && libreTranslateApiKey !== 'your_libretranslate_api_key_here';
  if (!isApiKeyConfigured) {
    console.warn('⚠️ LibreTranslate API key not configured. Attempting translation without API key (rate limits may apply).');
  }

  // Try each endpoint in sequence
  for (const endpoint of translationEndpoints) {
    console.log(`Trying translation endpoint: ${endpoint.url}`);
    const translatedText = await translateWithEndpoint(
      endpoint, 
      text, 
      validatedFrom, 
      validatedTo, 
      isApiKeyConfigured ? libreTranslateApiKey : undefined
    );
    if (translatedText) {
      console.log(`Successfully translated using: ${endpoint.url}`);
      return translatedText;
    }
  }

  console.warn('All LibreTranslate endpoints failed. Returning original text.');
  return text; // Return original text if all endpoints fail
}

/**
 * Processes text: detects language and translates to English if needed
 */
export async function processTranslation(text: string): Promise<{
  original: string;
  english: string;
  isEnglish: boolean;
}> {
  const detectedLang = await detectLanguage(text);
  const isEnglish = detectedLang === 'en';

  let english = text;
  if (!isEnglish) {
    english = await translateToEnglish(text, detectedLang);
  }

  return {
    original: text,
    english,
    isEnglish
  };
}
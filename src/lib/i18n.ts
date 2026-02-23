// src/lib/i18n.ts - Language management system
import en from '../../locales/en.json';
import sv from '../../locales/sv.json';
import fi from '../../locales/fi.json';
import da from '../../locales/da.json';
import nb from '../../locales/nb.json';
import es from '../../locales/es.json';
import fr from '../../locales/fr.json';
import de from '../../locales/de.json';
import it from '../../locales/it.json';
import hr from '../../locales/hr.json';
import is from '../../locales/is.json';

// Supported languages
export type SupportedLang = 'en' | 'sv' | 'fi' | 'da' | 'nb' | 'es' | 'fr' | 'de' | 'it' | 'hr' | 'is';

export const SUPPORTED_LANGUAGES: SupportedLang[] = ['en', 'sv', 'fi', 'da', 'nb', 'es', 'fr', 'de', 'it', 'hr', 'is'];

export const DEFAULT_LANGUAGE: SupportedLang = 'en';

// Translation data
const translations = {
  en,
  sv,
  fi,
  da,
  nb,
  es,
  fr,
  de,
  it,
  hr,
  is
};

// Load translation file for a specific language
export async function loadLanguage(lang: string): Promise<any> {
  const normalizedLang = lang.toLowerCase() as SupportedLang;
  return translations[normalizedLang] || translations[DEFAULT_LANGUAGE];
}

// Apply translations to the DOM (if needed)
export function applyTranslations(data: any): void {
  // This function would apply translations to the DOM
  // For now, we'll just log that translations are loaded
  console.log('Translations loaded for language:', data);
}

// Set HTML lang attribute
export function setHtmlLang(lang: string): void {
  document.documentElement.lang = lang;
}

// Get language from URL path
export function getLangFromPath(): SupportedLang {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  const firstSegment = segments[0]?.toLowerCase();
  
  if (SUPPORTED_LANGUAGES.includes(firstSegment as SupportedLang)) {
    return firstSegment as SupportedLang;
  }
  
  return DEFAULT_LANGUAGE;
}

// Get language information for display
export function getLanguageInfo() {
  const languageNames: Record<string, string> = {
    en: 'English',
    sv: 'Svenska',
    fi: 'Suomi',
    da: 'Dansk',
    nb: 'Norsk',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    hr: 'Hrvatski',
    is: 'Íslenska'
  };

  return SUPPORTED_LANGUAGES.map(lang => ({
    code: lang,
    name: languageNames[lang]
  }));
}

// Translate function
export function t(key: string, translations: any, fallback?: string): string {
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    if (value[k] === undefined) {
      return fallback || key;
    }
    value = value[k];
  }
  
  return value;
}

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { 
  SUPPORTED_LANGUAGES, 
  DEFAULT_LANGUAGE, 
  SupportedLang,
  loadLanguage as loadLanguageFile,
  applyTranslations,
  setHtmlLang,
  getLangFromPath,
  getLanguageInfo,
  t as translate
} from "@/lib/i18n";

interface Translations {
  [key: string]: any;
}

interface LanguageContextType {
  lang: SupportedLang;
  translations: Translations;
  setLang: (lang: SupportedLang) => void;
  t: (key: string, fallback?: string) => string;
  languages: { code: SupportedLang; name: string }[];
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<SupportedLang>(DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInitialLanguage() {
      const detectedLang = getLangFromPath();
      const translationData = await loadLanguageFile(detectedLang);
      
      setLangState(detectedLang);
      setTranslations(translationData);
      applyTranslations(translationData);
      setHtmlLang(detectedLang);
      setIsLoading(false);
    }

    loadInitialLanguage();
  }, []);

  const setLang = useCallback((newLang: SupportedLang) => {
    setIsLoading(true);
    localStorage.setItem("preferred-language", newLang);
    
    loadLanguageFile(newLang).then((translationData) => {
      setLangState(newLang);
      setTranslations(translationData);
      applyTranslations(translationData);
      setHtmlLang(newLang);
      setIsLoading(false);
      
      const currentPath = window.location.pathname;
      const segments = currentPath.split("/").filter(Boolean);
      
      if (SUPPORTED_LANGUAGES.includes(segments[0] as SupportedLang)) {
        segments[0] = newLang;
      } else {
        segments.unshift(newLang);
      }
      
      window.history.pushState({}, "", "/" + segments.join("/"));
    });
  }, []);

  const t = useCallback((key: string, fallback?: string): string => {
    return translate(key, translations, fallback);
  }, [translations]);

  const languages = useMemo(() => getLanguageInfo(), []);

  const value = useMemo(() => ({
    lang,
    translations,
    setLang,
    t,
    languages,
    isLoading,
  }), [lang, translations, setLang, t, languages, isLoading]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export type { Translations, LanguageContextType };


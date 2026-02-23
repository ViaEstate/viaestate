// src/components/LanguageSwitcher.tsx
import { useLanguage } from '../contexts/LanguageContext';

/**
 * LanguageSwitcher - UI-komponent för att byta språk
 * 
 * Visar tillgängliga språk och låter användare välja
 */
export default function LanguageSwitcher() {
  const { lang, setLang, languages } = useLanguage();

  const languageFlags: Record<string, string> = {
    en: '🇬🇧',
    sv: '🇸🇪',
    fi: '🇫🇮',
    da: '🇩🇰',
    nb: '🇳🇴',
    es: '🇪🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
    it: '🇮🇹',
    hr: '🇭🇷',
    is: '🇮🇸'
  };

  return (
    <div className="language-switcher">
      {/* Dropdown variant */}
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as any)}
        className="px-3 py-2 border rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {languages.map(({ code, name }) => (
          <option key={code} value={code}>
            {languageFlags[code]} {name}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Kompakt flagg-only variant (för mobil/header)
 */
export function CompactLanguageSwitcher() {
  const { lang, setLang, languages } = useLanguage();

  const languageFlags: Record<string, string> = {
    en: '🇬🇧',
    sv: '🇸🇪',
    fi: '🇫🇮',
    da: '🇩🇰',
    nb: '🇳🇴',
    es: '🇪🇸',
    fr: '🇫🇷',
    de: '🇩🇪',
    it: '🇮🇹',
    hr: '🇭🇷',
    is: '🇮🇸'
  };

  return (
    <div className="flex gap-2">
      {languages.map(({ code }) => (
        <button
          key={code}
          onClick={() => setLang(code as any)}
          className={`text-2xl transition-opacity ${
            lang === code ? 'opacity-100' : 'opacity-40 hover:opacity-70'
          }`}
          title={code}
        >
          {languageFlags[code]}
        </button>
      ))}
    </div>
  );
}
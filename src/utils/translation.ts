/**
 * Global translation helper for property fields
 * Provides a centralized way to get translated title/description with English fallback
 */

// Map language codes to database field suffixes
export const LANGUAGE_MAP: Record<string, string> = {
  en: "english",
  sv: "swedish",
  fi: "finnish",
  da: "danish",
  nb: "norwegian",
  de: "german",
  fr: "french",
  es: "spanish",
  it: "italian",
  hr: "croatian"
};

/**
 * Gets a translated field from a property item
 * @param item - The property object from Supabase
 * @param field - The field name (e.g., "title", "description")
 * @param language - The current language code (e.g., "sv", "de")
 * @returns The translated field value, or English fallback, or empty string
 */
export const getTranslatedField = (
  item: Record<string, any> | null | undefined,
  field: string,
  language: string
): string => {
  if (!item) return "";

  const suffix = LANGUAGE_MAP[language] || "english";

  // Try language-specific field first (e.g., "swedish_title")
  const languageField = `${suffix}_${field}`;
  if (item[languageField] && typeof item[languageField] === "string" && item[languageField].trim()) {
    return item[languageField];
  }

  // Fallback to English field (e.g., "english_title")
  const englishField = `english_${field}`;
  if (item[englishField] && typeof item[englishField] === "string" && item[englishField].trim()) {
    return item[englishField];
  }

  // Fallback to default field (e.g., "title")
  if (item[field] && typeof item[field] === "string" && item[field].trim()) {
    return item[field];
  }

  return "";
};

/**
 * Gets the translated title for a property
 * @param property - The property object from Supabase
 * @param language - The current language code
 * @returns The translated title
 */
export const getTranslatedTitle = (
  property: Record<string, any> | null | undefined,
  language: string
): string => {
  return getTranslatedField(property, "title", language);
};

/**
 * Gets the translated description for a property
 * @param property - The property object from Supabase
 * @param language - The current language code
 * @returns The translated description
 */
export const getTranslatedDescription = (
  property: Record<string, any> | null | undefined,
  language: string
): string => {
  return getTranslatedField(property, "description", language);
};

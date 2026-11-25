import { en } from "./en";
import { nb } from "./nb";
import type { SupportedLanguage, TranslationDictionary } from "./types";

export type { SupportedLanguage, TranslationDictionary } from "./types";

export const defaultLanguage: SupportedLanguage = "en";
export const supportedLanguages: SupportedLanguage[] = ["en", "nb"];

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en,
  nb,
};

/**
 * The dictionary for the language on <html lang>, for code outside React's tree (the API client,
 * the error boundary). The language provider keeps that attribute in step with the UI.
 */
export function getDocumentTranslations(): TranslationDictionary {
  const language = typeof document === "undefined" ? null : document.documentElement.lang;
  return translations[
    supportedLanguages.includes(language as SupportedLanguage) ? (language as SupportedLanguage) : defaultLanguage
  ];
}

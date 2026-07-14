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

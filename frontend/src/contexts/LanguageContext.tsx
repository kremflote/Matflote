import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  defaultLanguage,
  supportedLanguages,
  translations,
  type SupportedLanguage,
  type TranslationDictionary,
} from "../i18n";
import { getOptionalLocalPreference, localPreferenceKeys, setLocalPreference } from "../utils/localPreferences";

type LanguageContextValue = {
  language: SupportedLanguage;
  locale: string;
  setLanguage: (language: SupportedLanguage) => void;
  t: TranslationDictionary;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

type LanguageProviderProps = {
  children: ReactNode;
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<SupportedLanguage>(getInitialLanguage);

  const setLanguage = (nextLanguage: SupportedLanguage) => {
    setLanguageState(nextLanguage);
  };

  useEffect(() => {
    setLocalPreference(localPreferenceKeys.language, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      locale: translations[language].locale,
      setLanguage,
      t: translations[language],
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }

  return context;
}

function getInitialLanguage(): SupportedLanguage {
  const storedLanguage = getOptionalLocalPreference(localPreferenceKeys.language, supportedLanguages);

  if (storedLanguage !== null) {
    return storedLanguage;
  }

  const browserLanguage = navigator.language.toLowerCase();

  if (browserLanguage.startsWith("nb") || browserLanguage.startsWith("no")) {
    return "nb";
  }

  return defaultLanguage;
}

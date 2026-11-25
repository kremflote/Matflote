import {
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
} from "../i18n";
import { LanguageContext } from "./contextHooks";
import { getOptionalLocalPreference, localPreferenceKeys, setLocalPreference } from "../utils/localPreferences";

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

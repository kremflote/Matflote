import { useEffect, useState } from "react";
import RecipeBrowser, { type BrowserMode } from "../components/recipeBrowser";
import type { SiteTheme } from "../styles/appStyles";
import { getLocalPreference, localPreferenceKeys, setLocalPreference } from "../utils/localPreferences";

type CookbookPageProps = {
  theme: SiteTheme;
};

function CookbookPage({ theme }: CookbookPageProps) {
  const [browserMode, setBrowserMode] = useState<BrowserMode>(() =>
    getLocalPreference(localPreferenceKeys.cookbookMode, ["recipes", "ingredients"], "recipes"),
  );

  useEffect(() => {
    setLocalPreference(localPreferenceKeys.cookbookMode, browserMode);
  }, [browserMode]);

  return (
    <RecipeBrowser
      mode={browserMode}
      theme={theme}
      onModeChange={setBrowserMode}
    />
  );
}

export default CookbookPage;

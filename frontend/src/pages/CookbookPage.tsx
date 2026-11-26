import { useEffect, useState } from "react";
import RecipeBrowser, { type BrowserMode } from "../components/recipeBrowser";
import { getLocalPreference, localPreferenceKeys, setLocalPreference } from "../utils/localPreferences";

function CookbookPage() {
  const [browserMode, setBrowserMode] = useState<BrowserMode>(() =>
    getLocalPreference(localPreferenceKeys.cookbookMode, ["recipes", "ingredients"], "recipes"),
  );

  useEffect(() => {
    setLocalPreference(localPreferenceKeys.cookbookMode, browserMode);
  }, [browserMode]);

  return (
    <RecipeBrowser
      mode={browserMode}
      onModeChange={setBrowserMode}
    />
  );
}

export default CookbookPage;

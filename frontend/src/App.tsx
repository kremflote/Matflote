import { useEffect, useState } from "react";
import Header, { type PageId } from "./components/Header";
import CookbookPage from "./pages/CookbookPage";
import NutritionPage from "./pages/NutritionPage";
import PlannerPage from "./pages/PlannerPage";
import PricesPage from "./pages/PricesPage";
import ScannerPage from "./pages/ScannerPage";
import SettingsPage from "./pages/SettingsPage";
import { appStyles, type SiteTheme } from "./styles/appStyles";
import { getLocalPreference, localPreferenceKeys, setLocalPreference } from "./utils/localPreferences";

const pageIds: PageId[] = ["weekPlanner", "cookbook", "scanner", "prices", "nutrition", "settings"];
const themes: SiteTheme[] = ["dark", "light", "paletteLight"];

function App() {
  const [activePage, setActivePage] = useState<PageId>(() =>
    getLocalPreference(localPreferenceKeys.activePage, pageIds, "weekPlanner"),
  );
  const [theme, setTheme] = useState<SiteTheme>(() =>
    getLocalPreference(localPreferenceKeys.theme, themes, "dark"),
  );

  useEffect(() => {
    setLocalPreference(localPreferenceKeys.activePage, activePage);
  }, [activePage]);

  useEffect(() => {
    setLocalPreference(localPreferenceKeys.theme, theme);
  }, [theme]);

  return (
    <div className={appStyles.shell(theme)}>
      <Header
        activePage={activePage}
        onPageChange={setActivePage}
        theme={theme}
        onThemeChange={setTheme}
      />
      {activePage === "settings" && <SettingsPage theme={theme} />}
      {activePage === "weekPlanner" && <PlannerPage theme={theme} />}
      {activePage === "cookbook" && <CookbookPage theme={theme} />}
      {activePage === "scanner" && <ScannerPage theme={theme} />}
      {activePage === "prices" && <PricesPage theme={theme} />}
      {activePage === "nutrition" && <NutritionPage theme={theme} />}
    </div>
  );
}

export default App;

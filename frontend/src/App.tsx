import { lazy, Suspense, useEffect, useState } from "react";
import Header, { type PageId } from "./components/Header";
import CookbookPage from "./pages/CookbookPage";
import PlannerPage from "./pages/PlannerPage";
import { appStyles, type SiteTheme } from "./styles/appStyles";
import { getLocalPreference, localPreferenceKeys, setLocalPreference } from "./utils/localPreferences";

// The first load carries only the planner and the cookbook; the other pages load when first opened.
const NutritionPage = lazy(() => import("./pages/NutritionPage"));
const ScannerPage = lazy(() => import("./pages/ScannerPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

const pageIds: PageId[] = ["weekPlanner", "cookbook", "scanner", "nutrition", "settings"];
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
      {activePage === "weekPlanner" && <PlannerPage theme={theme} />}
      {activePage === "cookbook" && <CookbookPage theme={theme} />}
      <Suspense fallback={null}>
        {activePage === "settings" && <SettingsPage theme={theme} />}
        {activePage === "scanner" && <ScannerPage theme={theme} />}
        {activePage === "nutrition" && <NutritionPage theme={theme} />}
      </Suspense>
    </div>
  );
}

export default App;

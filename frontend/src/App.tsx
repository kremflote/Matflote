import { lazy, Suspense, useEffect, useState } from "react";
import Header, { type PageId } from "./components/Header";
import CookbookPage from "./pages/CookbookPage";
import PlannerPage from "./pages/PlannerPage";
import { appStyles, type SiteTheme } from "./styles/appStyles";
import { navigateTo, useHashRoute } from "./utils/hashRoute";
import { getLocalPreference, localPreferenceKeys, setLocalPreference } from "./utils/localPreferences";

// The first load carries only the planner and the cookbook; the other pages load when first opened.
const NutritionPage = lazy(() => import("./pages/NutritionPage"));
const ScannerPage = lazy(() => import("./pages/ScannerPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

const pageIds: PageId[] = ["weekPlanner", "cookbook", "scanner", "nutrition", "settings"];
// "light" was a neutral theme the header could no longer switch to; a browser that still has it gets the light theme.
const storedThemes = ["dark", "paletteLight", "light"] as const;

function App() {
  // The page comes from the address (#/planner, #/cookbook/recipe/12, ...). Without one, the page
  // last used is opened and its address written, replacing the bare entry rather than adding one.
  const route = useHashRoute();
  const [storedPage] = useState<PageId>(() =>
    getLocalPreference(localPreferenceKeys.activePage, pageIds, "weekPlanner"),
  );
  const activePage = route?.page ?? storedPage;
  const setActivePage = (page: PageId) => navigateTo({ page, detail: null });

  useEffect(() => {
    if (route === null) {
      navigateTo({ page: storedPage, detail: null }, { replace: true });
    }
  }, [route, storedPage]);
  const [theme, setTheme] = useState<SiteTheme>(() =>
    getLocalPreference(localPreferenceKeys.theme, storedThemes, "dark") === "dark" ? "dark" : "paletteLight",
  );

  useEffect(() => {
    setLocalPreference(localPreferenceKeys.activePage, activePage);
  }, [activePage]);

  useEffect(() => {
    setLocalPreference(localPreferenceKeys.theme, theme);
  }, [theme]);

  return (
    <div className={appStyles.shell} data-theme={theme === "dark" ? "dark" : "light"}>
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

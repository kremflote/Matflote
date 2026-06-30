import { useState } from "react";
import Header, { type PageId } from "./components/Header";
import CookbookPage from "./pages/CookbookPage";
import PlannerPage from "./pages/PlannerPage";
import SettingsPage from "./pages/SettingsPage";
import { appStyles, type SiteTheme } from "./styles/appStyles";

function App() {
  const [activePage, setActivePage] = useState<PageId>("weekPlanner");
  const [theme, setTheme] = useState<SiteTheme>("dark");

  return (
    <div className={appStyles.shell(theme)}>
      <Header
        activePage={activePage}
        onPageChange={setActivePage}
        theme={theme}
        onThemeChange={setTheme}
      />
      {activePage === "settings" && <SettingsPage />}
      {activePage === "weekPlanner" && <PlannerPage theme={theme} />}
      {activePage === "cookbook" && <CookbookPage />}
    </div>
  );
}

export default App;

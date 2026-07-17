import { useState } from "react";
import Header, { type PageId } from "./components/Header";
import CookbookPage from "./pages/CookbookPage";
import PlannerPage from "./pages/PlannerPage";
import PricesPage from "./pages/PricesPage";
import ScannerPage from "./pages/ScannerPage";
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
      {activePage === "settings" && <SettingsPage theme={theme} />}
      {activePage === "weekPlanner" && <PlannerPage theme={theme} />}
      {activePage === "cookbook" && <CookbookPage theme={theme} />}
      {activePage === "scanner" && <ScannerPage theme={theme} />}
      {activePage === "prices" && <PricesPage theme={theme} />}
    </div>
  );
}

export default App;

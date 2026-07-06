import Browser from "./Browser";
import AddButton from "./AddButton";
import RecipeIngredientToggle from "./RecipeIngredientToggle";
import { pageStyles, type SiteTheme } from "../../styles/appStyles";
import { recipeBrowserStyles } from "./recipeBrowserStyles";
import type { BrowserMode } from "./types";

type RecipeBrowserProps = {
  mode: BrowserMode;
  theme: SiteTheme;
  onModeChange: (value: BrowserMode) => void;
};

function RecipeBrowser({ mode, theme, onModeChange }: RecipeBrowserProps) {
  return (
    <main className={pageStyles.shell}>
      <Browser
        mode={mode}
        theme={theme}
        headerActions={
          <>
            <div className={recipeBrowserStyles.headerActionButtonSlot}>
              <AddButton target={mode === "recipes" ? "recipe" : "ingredient"} theme={theme} />
            </div>
            <div className={recipeBrowserStyles.headerModeToggleSlot}>
              <RecipeIngredientToggle value={mode} theme={theme} onChange={onModeChange} />
            </div>
          </>
        }
      />
    </main>
  );
}

export default RecipeBrowser;

import Browser from "./Browser";
import AddButton from "./AddButton";
import RecipeIngredientToggle from "./RecipeIngredientToggle";
import { pageStyles } from "../../styles/appStyles";
import { recipeBrowserStyles } from "./recipeBrowserStyles";
import type { BrowserMode } from "./types";

type RecipeBrowserProps = {
  mode: BrowserMode;
  onModeChange: (value: BrowserMode) => void;
};

function RecipeBrowser({ mode, onModeChange }: RecipeBrowserProps) {
  return (
    <main className={pageStyles.shell}>
      <Browser
        mode={mode}
        headerActions={
          <div className={recipeBrowserStyles.headerActionButtonSlot}>
            <AddButton target={mode === "recipes" ? "recipe" : "ingredient"} />
          </div>
        }
        modeToggle={
          <RecipeIngredientToggle value={mode} onChange={onModeChange} />
        }
      />
    </main>
  );
}

export default RecipeBrowser;

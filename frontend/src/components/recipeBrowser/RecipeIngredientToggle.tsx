import { useLanguage } from "../../contexts";
import { recipeBrowserStyles } from "./recipeBrowserStyles";
import type { BrowserMode } from "./types";

type RecipeIngredientToggleProps = {
  value: BrowserMode;
  onChange: (value: BrowserMode) => void;
  className?: string;
};

function RecipeIngredientToggle({ value, onChange, className = "" }: RecipeIngredientToggleProps) {
  const { t } = useLanguage();

  return (
    <div className={`${recipeBrowserStyles.tabs} ${className}`} aria-label={t.cookbook.cookbookSections}>
      <button
        className={recipeBrowserStyles.tab(value === "recipes")}
        type="button"
        onClick={() => onChange("recipes")}
      >
        {t.cookbook.recipes}
      </button>
      <button
        className={recipeBrowserStyles.tab(value === "ingredients")}
        type="button"
        onClick={() => onChange("ingredients")}
      >
        {t.cookbook.ingredients}
      </button>
    </div>
  );
}

export default RecipeIngredientToggle;

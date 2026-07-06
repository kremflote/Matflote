import type { IRecipe } from "../../interfaces/IRecipe";
import type { SiteTheme } from "../../styles/appStyles";
import { plannerPickerStyles } from "../../styles/appStyles";
import RecipeThumbnail from "../RecipeThumbnail";

type PlannerRecipePickerSelectionProps = {
  mainRecipe: IRecipe | null;
  supplementaryRecipes: IRecipe[];
  theme: SiteTheme;
  onToggleSupplementaryRecipe: (recipe: IRecipe) => void;
};

function PlannerRecipePickerSelection({
  mainRecipe,
  supplementaryRecipes,
  theme,
  onToggleSupplementaryRecipe,
}: PlannerRecipePickerSelectionProps) {
  if (mainRecipe === null && supplementaryRecipes.length === 0) {
    return null;
  }

  return (
    <section className={`${plannerPickerStyles.selectedSection} ${plannerPickerStyles.selectedSectionBorder(theme)}`}>
      {mainRecipe !== null && (
        <div className={plannerPickerStyles.selectedMainGrid}>
          <RecipeThumbnail
            className={plannerPickerStyles.selectedMainThumbnail}
            recipe={{
              imageUrl: mainRecipe.imageUrl,
              name: mainRecipe.name,
              subtitle: mainRecipe.cuisine?.name ?? mainRecipe.recipeType,
            }}
            theme={theme}
          />
          {supplementaryRecipes.length > 0 && (
            <SupplementaryStrip
              recipes={supplementaryRecipes}
              theme={theme}
              onToggleSupplementaryRecipe={onToggleSupplementaryRecipe}
            />
          )}
        </div>
      )}
      {mainRecipe === null && supplementaryRecipes.length > 0 && (
        <SupplementaryStrip
          recipes={supplementaryRecipes}
          theme={theme}
          onToggleSupplementaryRecipe={onToggleSupplementaryRecipe}
        />
      )}
    </section>
  );
}

type SupplementaryStripProps = {
  recipes: IRecipe[];
  theme: SiteTheme;
  onToggleSupplementaryRecipe: (recipe: IRecipe) => void;
};

function SupplementaryStrip({ recipes, theme, onToggleSupplementaryRecipe }: SupplementaryStripProps) {
  return (
    <div className={plannerPickerStyles.selectedStrip}>
      {recipes.map((recipe) => (
        <button
          className={plannerPickerStyles.selectedItem(theme)}
          key={recipe.recipeId}
          type="button"
          onClick={() => onToggleSupplementaryRecipe(recipe)}
        >
          {recipe.name} x
        </button>
      ))}
    </div>
  );
}

export default PlannerRecipePickerSelection;

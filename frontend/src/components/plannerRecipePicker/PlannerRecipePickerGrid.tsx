import type { IRecipe } from "../../interfaces/IRecipe";
import type { SiteTheme } from "../../styles/appStyles";
import { plannerPickerStyles } from "../../styles/appStyles";
import RecipeThumbnail from "../RecipeThumbnail";
import type { PickerPhase } from "./plannerRecipePickerTypes";

type PlannerRecipePickerGridProps = {
  highlightedMainRecipeId: number | null;
  phase: PickerPhase;
  recipes: IRecipe[];
  supplementaryRecipeIds: number[];
  theme: SiteTheme;
  onSelectMainRecipe: (recipe: IRecipe) => void;
  onToggleSupplementaryRecipe: (recipe: IRecipe) => void;
};

function PlannerRecipePickerGrid({
  highlightedMainRecipeId,
  phase,
  recipes,
  supplementaryRecipeIds,
  theme,
  onSelectMainRecipe,
  onToggleSupplementaryRecipe,
}: PlannerRecipePickerGridProps) {
  if (recipes.length === 0) {
    return (
      <div className={plannerPickerStyles.emptyState(theme)}>No matching recipes found.</div>
    );
  }

  return (
    <div className={plannerPickerStyles.recipeGrid}>
      {recipes.map((recipe) => {
        const selected =
          phase === "main"
            ? recipe.recipeId === highlightedMainRecipeId
            : supplementaryRecipeIds.includes(recipe.recipeId);

        return (
          <RecipeThumbnail
            ariaPressed={selected}
            className={plannerPickerStyles.recipeCard(theme, selected)}
            key={recipe.recipeId}
            recipe={{
              imageUrl: recipe.imageUrl,
              name: recipe.name,
              subtitle: recipe.cuisine?.name ?? recipe.recipeType,
            }}
            interactiveEffect={false}
            theme={theme}
            onClick={() =>
              phase === "main"
                ? onSelectMainRecipe(recipe)
                : onToggleSupplementaryRecipe(recipe)
            }
          />
        );
      })}
    </div>
  );
}

export default PlannerRecipePickerGrid;

import { useLanguage } from "../../contexts";
import type { IRecipe } from "../../interfaces/IRecipe";
import type { SiteTheme } from "../../styles/appStyles";
import RecipeThumbnail from "../RecipeThumbnail";
import { recipeBrowserStyles } from "./recipeBrowserStyles";

type RecipeSelectionGridProps = {
  recipes: IRecipe[];
  theme: SiteTheme;
  getSubtitle?: (recipe: IRecipe) => string;
  selectedRecipeIds?: number[];
  onSelect: (recipe: IRecipe) => void;
};

function RecipeSelectionGrid({
  recipes,
  theme,
  getSubtitle,
  selectedRecipeIds = [],
  onSelect,
}: RecipeSelectionGridProps) {
  const { t } = useLanguage();

  return (
    <div className={recipeBrowserStyles.recipeGrid}>
      {recipes.map((recipe) => {
        const selected = selectedRecipeIds.includes(recipe.recipeId);

        return (
          <RecipeThumbnail
            ariaPressed={selected}
            className={`${recipeBrowserStyles.recipeCard(theme)} ${
              selected ? recipeBrowserStyles.componentRecipeSelected : ""
            }`}
            interactiveEffect={false}
            key={recipe.recipeId}
            theme={theme}
            recipe={{
              imageUrl: recipe.imageUrl,
              name: recipe.name,
              subtitle: getSubtitle?.(recipe) ?? recipe.cuisine?.name ?? t.enums.recipeTypes[recipe.recipeType],
            }}
            onClick={() => onSelect(recipe)}
          />
        );
      })}
    </div>
  );
}

export default RecipeSelectionGrid;

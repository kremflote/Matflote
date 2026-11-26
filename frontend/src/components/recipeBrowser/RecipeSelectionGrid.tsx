import { useLanguage } from "../../contexts";
import type { IRecipe } from "../../interfaces/IRecipe";
import RecipeThumbnail from "../RecipeThumbnail";
import { recipeBrowserStyles } from "./recipeBrowserStyles";

type RecipeSelectionGridProps = {
  recipes: IRecipe[];
  getSubtitle?: (recipe: IRecipe) => string;
  gridClassName?: string;
  selectedRecipeIds?: number[];
  onSelect: (recipe: IRecipe) => void;
};

function RecipeSelectionGrid({
  recipes,
  getSubtitle,
  gridClassName = recipeBrowserStyles.recipeGrid,
  selectedRecipeIds = [],
  onSelect,
}: RecipeSelectionGridProps) {
  const { t } = useLanguage();

  return (
    <div className={gridClassName}>
      {recipes.map((recipe) => {
        const selected = selectedRecipeIds.includes(recipe.recipeId);

        return (
          <RecipeThumbnail
            ariaPressed={selected}
            className={`${recipeBrowserStyles.recipeCard} ${
              selected ? recipeBrowserStyles.componentRecipeSelected : ""
            }`}
            interactiveEffect={false}
            key={recipe.recipeId}
            recipe={{
              imageUrl: recipe.imageUrl,
              thumbnailUrl: recipe.thumbnailUrl,
              name: recipe.name,
              ingredients: recipe.ingredients,
              subtitle: getSubtitle?.(recipe) ?? recipe.tags.slice(0, 2).map((tag) => t.enums.recipeTags[tag] ?? tag).join(" · "),
            }}
            onClick={() => onSelect(recipe)}
          />
        );
      })}
    </div>
  );
}

export default RecipeSelectionGrid;

import { useLanguage } from "../../contexts";
import IngredientThumbnail from "../IngredientThumbnail";
import type { IIngredient } from "../../interfaces/IIngredient";
import type { SiteTheme } from "../../styles/appStyles";
import { recipeBrowserStyles } from "./recipeBrowserStyles";
import type { BrowserDetail, BrowserMode, EnrichedRecipe } from "./types";
import RecipeSelectionGrid from "./RecipeSelectionGrid";

type BrowserResultsProps = {
  filteredIngredients: IIngredient[];
  filteredRecipes: EnrichedRecipe[];
  ingredientError: string | null;
  ingredientIsLoading: boolean;
  mode: BrowserMode;
  recipeError: string | null;
  recipeIsLoading: boolean;
  theme: SiteTheme;
  onSelectDetail: (detail: BrowserDetail) => void;
};

function BrowserResults({
  filteredIngredients,
  filteredRecipes,
  ingredientError,
  ingredientIsLoading,
  mode,
  recipeError,
  recipeIsLoading,
  theme,
  onSelectDetail,
}: BrowserResultsProps) {
  const { t } = useLanguage();

  if (mode === "ingredients") {
    if (ingredientIsLoading) {
      return <EmptyState theme={theme} title={t.cookbook.loadingIngredients} body={t.cookbook.fetchingPantry} />;
    }

    if (ingredientError !== null) {
      return <EmptyState theme={theme} title={t.cookbook.couldNotLoadIngredients} body={ingredientError} />;
    }

    if (filteredIngredients.length === 0) {
      return <EmptyState theme={theme} title={t.cookbook.noIngredientsFound} body={t.cookbook.tryChangingSearch} />;
    }

    return (
      <div className={recipeBrowserStyles.ingredientGridPanel(theme)}>
        <div className={recipeBrowserStyles.ingredientGrid}>
          {filteredIngredients.map((ingredient) => (
            <IngredientThumbnail
              ingredient={ingredient}
              key={ingredient.ingredientId}
              theme={theme}
              onClick={() => onSelectDetail({ kind: "ingredient", ingredient })}
            />
          ))}
        </div>
      </div>
    );
  }

  if (recipeIsLoading) {
    return <EmptyState theme={theme} title={t.cookbook.loadingRecipes} body={t.cookbook.fetchingCookbook} />;
  }

  if (recipeError !== null) {
    return <EmptyState theme={theme} title={t.cookbook.couldNotLoadRecipes} body={recipeError} />;
  }

  if (filteredRecipes.length === 0) {
    return <EmptyState theme={theme} title={t.cookbook.noRecipesFound} body={t.cookbook.tryChangingSearch} />;
  }

  return (
    <RecipeSelectionGrid
      recipes={filteredRecipes}
      theme={theme}
      onSelect={(recipe) => onSelectDetail({ kind: "recipe", recipe })}
    />
  );
}

type EmptyStateProps = {
  title: string;
  body: string;
  theme: SiteTheme;
};

function EmptyState({ title, body, theme }: EmptyStateProps) {
  return (
    <div className={recipeBrowserStyles.emptyState(theme)}>
      <h2 className={recipeBrowserStyles.emptyStateTitle}>{title}</h2>
      <p className={recipeBrowserStyles.emptyStateBody}>{body}</p>
    </div>
  );
}

export default BrowserResults;

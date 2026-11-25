import { useCallback, useMemo } from "react";
import type { IRecipe } from "../interfaces/IRecipe";
import type { IRecipeContext } from "../interfaces/contexts/IRecipeContext";
import type { IProviderProps } from "../interfaces/IProviderProps";
import { recipeService } from "../services";
import { compareOrdinal, upsertSorted, useCatalogList } from "./contextHelpers";
import { RecipeContext } from "./contextHooks";

const compareRecipes = (first: IRecipe, second: IRecipe) => compareOrdinal(first.name, second.name);

export function RecipeProvider({ children }: IProviderProps) {
  const {
    items: recipes,
    setItems: setRecipes,
    isLoading: recipeIsLoading,
    error: initError,
    refresh: refreshRecipes,
  } = useCatalogList(recipeService.getAll);

  const upsertRecipe = useCallback(
    (recipe: IRecipe) =>
      setRecipes((current) => upsertSorted(current, recipe, (item) => item.recipeId, compareRecipes)),
    [setRecipes],
  );

  const value = useMemo<IRecipeContext>(
    () => ({
      recipes,
      recipeIsLoading,
      initError,
      refreshRecipes,
      upsertRecipe,
    }),
    [recipes, recipeIsLoading, initError, refreshRecipes, upsertRecipe],
  );

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}

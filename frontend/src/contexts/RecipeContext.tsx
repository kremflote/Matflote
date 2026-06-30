import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { IRecipe } from "../interfaces/IRecipe";
import type { IRecipeContext } from "../interfaces/contexts/IRecipeContext";
import type { IProviderProps } from "../interfaces/IProviderProps";
import { recipeService } from "../services";
import { getErrorMessage } from "./contextHelpers";

const RecipeContext = createContext<IRecipeContext | null>(null);

export function RecipeProvider({ children }: IProviderProps) {
  const [recipes, setRecipes] = useState<IRecipe[]>([]);
  const [recipeIsLoading, setRecipeIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const refreshRecipes = useCallback(async () => {
    setRecipeIsLoading(true);
    setInitError(null);

    try {
      setRecipes(await recipeService.getAll());
    } catch (error) {
      setInitError(getErrorMessage(error));
    } finally {
      setRecipeIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshRecipes();
  }, [refreshRecipes]);

  const value = useMemo<IRecipeContext>(
    () => ({
      recipes,
      recipeIsLoading,
      initError,
      refreshRecipes,
    }),
    [recipes, recipeIsLoading, initError, refreshRecipes],
  );

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}

export function useRecipes() {
  const context = useContext(RecipeContext);
  if (context === null) {
    throw new Error("useRecipes must be used inside RecipeProvider.");
  }

  return context;
}

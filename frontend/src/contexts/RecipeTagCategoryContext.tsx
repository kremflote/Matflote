import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { IProviderProps } from "../interfaces/IProviderProps";
import type { IRecipeTagCategory } from "../interfaces/ILookup";
import type { IRecipeTagCategoryContext } from "../interfaces/contexts/IRecipeTagCategoryContext";
import { recipeTagCategoryService } from "../services";

const RecipeTagCategoryContext = createContext<IRecipeTagCategoryContext | null>(null);

export function RecipeTagCategoryProvider({ children }: IProviderProps) {
  const [recipeTagCategories, setRecipeTagCategories] = useState<IRecipeTagCategory[]>([]);
  const [recipeTagCategoryIsLoading, setRecipeTagCategoryIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const refreshRecipeTagCategories = useCallback(async () => {
    setRecipeTagCategoryIsLoading(true);
    setInitError(null);

    try {
      setRecipeTagCategories(await recipeTagCategoryService.getAll());
    } catch (error) {
      setInitError(error instanceof Error ? error.message : "Could not load recipe tag categories.");
    } finally {
      setRecipeTagCategoryIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshRecipeTagCategories();
  }, [refreshRecipeTagCategories]);

  const value = useMemo<IRecipeTagCategoryContext>(
    () => ({
      recipeTagCategories,
      recipeTagCategoryIsLoading,
      initError,
      refreshRecipeTagCategories,
    }),
    [recipeTagCategories, recipeTagCategoryIsLoading, initError, refreshRecipeTagCategories],
  );

  return (
    <RecipeTagCategoryContext.Provider value={value}>
      {children}
    </RecipeTagCategoryContext.Provider>
  );
}

export function useRecipeTagCategories() {
  const context = useContext(RecipeTagCategoryContext);
  if (context === null) {
    throw new Error("useRecipeTagCategories must be used inside RecipeTagCategoryProvider.");
  }

  return context;
}

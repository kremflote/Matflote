import { useMemo } from "react";
import type { IIngredientTagCategoryContext } from "../interfaces/contexts/IIngredientTagCategoryContext";
import type { IProviderProps } from "../interfaces/IProviderProps";
import { ingredientTagCategoryService } from "../services";
import { useCatalogList } from "./contextHelpers";
import { IngredientTagCategoryContext } from "./contextHooks";

export function IngredientTagCategoryProvider({ children }: IProviderProps) {
  const {
    items: ingredientTagCategories,
    isLoading: ingredientTagCategoryIsLoading,
    error: initError,
    refresh: refreshIngredientTagCategories,
  } = useCatalogList(ingredientTagCategoryService.getAll);

  const value = useMemo<IIngredientTagCategoryContext>(
    () => ({
      ingredientTagCategories,
      ingredientTagCategoryIsLoading,
      initError,
      refreshIngredientTagCategories,
    }),
    [ingredientTagCategories, ingredientTagCategoryIsLoading, initError, refreshIngredientTagCategories],
  );

  return (
    <IngredientTagCategoryContext.Provider value={value}>
      {children}
    </IngredientTagCategoryContext.Provider>
  );
}

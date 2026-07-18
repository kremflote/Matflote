import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { IIngredientTagCategory } from "../interfaces/ILookup";
import type { IIngredientTagCategoryContext } from "../interfaces/contexts/IIngredientTagCategoryContext";
import type { IProviderProps } from "../interfaces/IProviderProps";
import { ingredientTagCategoryService } from "../services";
import { getErrorMessage } from "./contextHelpers";

const IngredientTagCategoryContext = createContext<IIngredientTagCategoryContext | null>(null);

export function IngredientTagCategoryProvider({ children }: IProviderProps) {
  const [ingredientTagCategories, setIngredientTagCategories] = useState<IIngredientTagCategory[]>([]);
  const [ingredientTagCategoryIsLoading, setIngredientTagCategoryIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const refreshIngredientTagCategories = useCallback(async () => {
    setIngredientTagCategoryIsLoading(true);
    setInitError(null);

    try {
      setIngredientTagCategories(await ingredientTagCategoryService.getAll());
    } catch (error) {
      setInitError(getErrorMessage(error));
    } finally {
      setIngredientTagCategoryIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshIngredientTagCategories();
  }, [refreshIngredientTagCategories]);

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

export function useIngredientTagCategories() {
  const context = useContext(IngredientTagCategoryContext);
  if (context === null) {
    throw new Error("useIngredientTagCategories must be used inside IngredientTagCategoryProvider.");
  }

  return context;
}

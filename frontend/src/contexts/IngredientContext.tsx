import { useCallback, useMemo } from "react";
import type { IIngredient } from "../interfaces/IIngredient";
import type { IIngredientContext } from "../interfaces/contexts/IIngredientContext";
import type { IProviderProps } from "../interfaces/IProviderProps";
import { ingredientService } from "../services";
import { compareOrdinal, upsertSorted, useCatalogList } from "./contextHelpers";
import { IngredientContext } from "./contextHooks";

const compareIngredients = (first: IIngredient, second: IIngredient) =>
  compareOrdinal(first.ingredientName, second.ingredientName);

export function IngredientProvider({ children }: IProviderProps) {
  const {
    items: ingredients,
    setItems: setIngredients,
    isLoading: ingredientIsLoading,
    error: initError,
    refresh: refreshIngredients,
  } = useCatalogList(ingredientService.getAll);

  const upsertIngredient = useCallback(
    (ingredient: IIngredient) =>
      setIngredients((current) => upsertSorted(current, ingredient, (item) => item.ingredientId, compareIngredients)),
    [setIngredients],
  );

  const removeIngredient = useCallback(
    (ingredientId: number) =>
      setIngredients((current) => current.filter((item) => item.ingredientId !== ingredientId)),
    [setIngredients],
  );

  const value = useMemo<IIngredientContext>(
    () => ({
      ingredients,
      ingredientIsLoading,
      initError,
      refreshIngredients,
      removeIngredient,
      upsertIngredient,
    }),
    [ingredients, ingredientIsLoading, initError, refreshIngredients, removeIngredient, upsertIngredient],
  );

  return <IngredientContext.Provider value={value}>{children}</IngredientContext.Provider>;
}

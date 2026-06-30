import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { IIngredient } from "../interfaces/IIngredient";
import type { IIngredientContext } from "../interfaces/contexts/IIngredientContext";
import type { IProviderProps } from "../interfaces/IProviderProps";
import { ingredientService } from "../services";
import { getErrorMessage } from "./contextHelpers";

const IngredientContext = createContext<IIngredientContext | null>(null);

export function IngredientProvider({ children }: IProviderProps) {
  const [ingredients, setIngredients] = useState<IIngredient[]>([]);
  const [ingredientIsLoading, setIngredientIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const refreshIngredients = useCallback(async () => {
    setIngredientIsLoading(true);
    setInitError(null);

    try {
      setIngredients(await ingredientService.getAll());
    } catch (error) {
      setInitError(getErrorMessage(error));
    } finally {
      setIngredientIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshIngredients();
  }, [refreshIngredients]);

  const value = useMemo<IIngredientContext>(
    () => ({
      ingredients,
      ingredientIsLoading,
      initError,
      refreshIngredients,
    }),
    [ingredients, ingredientIsLoading, initError, refreshIngredients],
  );

  return <IngredientContext.Provider value={value}>{children}</IngredientContext.Provider>;
}

export function useIngredients() {
  const context = useContext(IngredientContext);
  if (context === null) {
    throw new Error("useIngredients must be used inside IngredientProvider.");
  }

  return context;
}

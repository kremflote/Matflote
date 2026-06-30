import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { IDish } from "../interfaces/IDish";
import type { IDishContext } from "../interfaces/contexts/IDishContext";
import type { IProviderProps } from "../interfaces/IProviderProps";
import { dishService } from "../services";
import { getErrorMessage } from "./contextHelpers";

const DishContext = createContext<IDishContext | null>(null);

export function DishProvider({ children }: IProviderProps) {
  const [dishes, setDishes] = useState<IDish[]>([]);
  const [dishIsLoading, setDishIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const refreshDishes = useCallback(async () => {
    setDishIsLoading(true);
    setInitError(null);

    try {
      setDishes(await dishService.getAll());
    } catch (error) {
      setInitError(getErrorMessage(error));
    } finally {
      setDishIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshDishes();
  }, [refreshDishes]);

  const value = useMemo<IDishContext>(
    () => ({
      dishes,
      dishIsLoading,
      initError,
      refreshDishes,
    }),
    [dishes, dishIsLoading, initError, refreshDishes],
  );

  return <DishContext.Provider value={value}>{children}</DishContext.Provider>;
}

export function useDishes() {
  const context = useContext(DishContext);
  if (context === null) {
    throw new Error("useDishes must be used inside DishProvider.");
  }

  return context;
}

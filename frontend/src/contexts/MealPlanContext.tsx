import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { IMealPlanEntry } from "../interfaces/IMeal";
import type { IProviderProps } from "../interfaces/IProviderProps";
import type { IMealPlanContext, IMealPlanRange } from "../interfaces/contexts/IMealPlanContext";
import { mealPlanService } from "../services";
import { getErrorMessage } from "./contextHelpers";

const MealPlanContext = createContext<IMealPlanContext | null>(null);

export function MealPlanProvider({ children }: IProviderProps) {
  const [mealPlanEntries, setMealPlanEntries] = useState<IMealPlanEntry[]>([]);
  const [mealPlanIsLoading, setMealPlanIsLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [loadedRange, setLoadedRange] = useState<IMealPlanRange | null>(null);

  const loadMealPlan = useCallback(async (from: string, to: string) => {
    setMealPlanIsLoading(true);
    setInitError(null);

    try {
      setMealPlanEntries(await mealPlanService.getRange(from, to));
      setLoadedRange({ from, to });
    } catch (error) {
      setInitError(getErrorMessage(error));
    } finally {
      setMealPlanIsLoading(false);
    }
  }, []);

  const refreshMealPlan = useCallback(async () => {
    if (loadedRange === null) {
      return;
    }

    await loadMealPlan(loadedRange.from, loadedRange.to);
  }, [loadedRange, loadMealPlan]);

  const value = useMemo<IMealPlanContext>(
    () => ({
      mealPlanEntries,
      mealPlanIsLoading,
      initError,
      loadedRange,
      loadMealPlan,
      refreshMealPlan,
    }),
    [mealPlanEntries, mealPlanIsLoading, initError, loadedRange, loadMealPlan, refreshMealPlan],
  );

  return <MealPlanContext.Provider value={value}>{children}</MealPlanContext.Provider>;
}

export function useMealPlan() {
  const context = useContext(MealPlanContext);
  if (context === null) {
    throw new Error("useMealPlan must be used inside MealPlanProvider.");
  }

  return context;
}

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

  const saveMealPlanEntry = useCallback(
    async (id: number | null, entry: Parameters<typeof mealPlanService.create>[0]) => {
      setMealPlanIsLoading(true);
      setInitError(null);

      try {
        if (id === null) {
          await mealPlanService.create(entry);
        } else {
          await mealPlanService.update(id, entry);
        }

        if (loadedRange !== null) {
          setMealPlanEntries(await mealPlanService.getRange(loadedRange.from, loadedRange.to));
        }
      } catch (error) {
        setInitError(getErrorMessage(error));
        throw error;
      } finally {
        setMealPlanIsLoading(false);
      }
    },
    [loadedRange],
  );

  const clearMealPlanRange = useCallback(
    async (from: string, to: string) => {
      setMealPlanIsLoading(true);
      setInitError(null);

      try {
        const entriesToDelete = mealPlanEntries.filter((entry) => entry.date >= from && entry.date <= to);

        await Promise.all(
          entriesToDelete.map((entry) => mealPlanService.delete(entry.mealPlanEntryId)),
        );

        if (loadedRange !== null) {
          setMealPlanEntries(await mealPlanService.getRange(loadedRange.from, loadedRange.to));
        }
      } catch (error) {
        setInitError(getErrorMessage(error));
        throw error;
      } finally {
        setMealPlanIsLoading(false);
      }
    },
    [loadedRange, mealPlanEntries],
  );

  const deleteMealPlanEntry = useCallback(
    async (id: number) => {
      setMealPlanIsLoading(true);
      setInitError(null);

      try {
        await mealPlanService.delete(id);

        if (loadedRange !== null) {
          setMealPlanEntries(await mealPlanService.getRange(loadedRange.from, loadedRange.to));
        }
      } catch (error) {
        setInitError(getErrorMessage(error));
        throw error;
      } finally {
        setMealPlanIsLoading(false);
      }
    },
    [loadedRange],
  );

  const value = useMemo<IMealPlanContext>(
    () => ({
      mealPlanEntries,
      mealPlanIsLoading,
      initError,
      loadedRange,
      clearMealPlanRange,
      deleteMealPlanEntry,
      loadMealPlan,
      refreshMealPlan,
      saveMealPlanEntry,
    }),
    [
      mealPlanEntries,
      mealPlanIsLoading,
      initError,
      loadedRange,
      clearMealPlanRange,
      deleteMealPlanEntry,
      loadMealPlan,
      refreshMealPlan,
      saveMealPlanEntry,
    ],
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

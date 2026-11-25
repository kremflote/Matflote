import { useCallback, useMemo, useRef, useState } from "react";
import type { IMealPlanEntry } from "../interfaces/IMeal";
import type { IProviderProps } from "../interfaces/IProviderProps";
import type { IMealPlanContext, IMealPlanRange } from "../interfaces/contexts/IMealPlanContext";
import { mealPlanService } from "../services";
import type { MealPlanBatchRequest, MealPlanEntryRequest } from "../services/mealPlanService";
import { getErrorMessage } from "./contextHelpers";
import { MealPlanContext } from "./contextHooks";

export function MealPlanProvider({ children }: IProviderProps) {
  const [mealPlanEntries, setMealPlanEntries] = useState<IMealPlanEntry[]>([]);
  const [requestedRange, setRequestedRange] = useState<IMealPlanRange | null>(null);
  const [loadedRange, setLoadedRange] = useState<IMealPlanRange | null>(null);
  const [savingCount, setSavingCount] = useState(0);
  const [initError, setInitError] = useState<string | null>(null);
  const latestLoad = useRef(0);

  const loadMealPlan = useCallback(async (from: string, to: string) => {
    const request = ++latestLoad.current;
    setRequestedRange({ from, to });

    try {
      const entries = await mealPlanService.getRange(from, to);
      if (request === latestLoad.current) {
        setMealPlanEntries(entries);
        setLoadedRange({ from, to });
        setInitError(null);
      }
    } catch (error) {
      if (request === latestLoad.current) {
        setInitError(getErrorMessage(error));
      }
    }
  }, []);

  const refreshMealPlan = useCallback(async () => {
    if (loadedRange === null) {
      return;
    }

    await loadMealPlan(loadedRange.from, loadedRange.to);
  }, [loadedRange, loadMealPlan]);

  const runWrite = useCallback(async (write: () => Promise<void>) => {
    setSavingCount((count) => count + 1);
    setInitError(null);

    try {
      await write();
    } catch (error) {
      setInitError(getErrorMessage(error));
      throw error;
    } finally {
      setSavingCount((count) => count - 1);
    }
  }, []);

  const saveMealPlanEntry = useCallback(
    (id: number | null, entry: MealPlanEntryRequest) =>
      runWrite(async () => {
        if (id !== null && entry.recipes.length === 0) {
          await mealPlanService.delete(id);
          setMealPlanEntries((current) => current.filter((item) => item.mealPlanEntryId !== id));
          return;
        }

        // The API returns the saved entry, so the week does not have to be fetched again.
        const saved = id === null ? await mealPlanService.create(entry) : await mealPlanService.update(id, entry);
        setMealPlanEntries((current) => [...current.filter((item) => item.mealPlanEntryId !== saved.mealPlanEntryId), saved]);
      }),
    [runWrite],
  );

  const deleteMealPlanEntry = useCallback(
    (id: number) =>
      runWrite(async () => {
        await mealPlanService.delete(id);
        setMealPlanEntries((current) => current.filter((item) => item.mealPlanEntryId !== id));
      }),
    [runWrite],
  );

  const applyMealPlanBatch = useCallback(
    (request: MealPlanBatchRequest) =>
      runWrite(async () => {
        const result = await mealPlanService.batch(request);
        // The result holds every entry in from..to, so it replaces that part of what is on screen.
        setMealPlanEntries((current) => [
          ...current.filter((entry) => entry.date < result.from || entry.date > result.to),
          ...result.entries,
        ]);
      }),
    [runWrite],
  );

  const clearMealPlanRange = useCallback(
    (from: string, to: string) => applyMealPlanBatch({ clearRange: { from, to } }),
    [applyMealPlanBatch],
  );

  // Loading means "the requested range has no data on screen yet", never "a refresh is running".
  const mealPlanIsLoading =
    requestedRange !== null &&
    (loadedRange === null || loadedRange.from !== requestedRange.from || loadedRange.to !== requestedRange.to);

  const value = useMemo<IMealPlanContext>(
    () => ({
      mealPlanEntries,
      mealPlanIsLoading,
      mealPlanIsSaving: savingCount > 0,
      initError,
      loadedRange,
      applyMealPlanBatch,
      clearMealPlanRange,
      deleteMealPlanEntry,
      loadMealPlan,
      refreshMealPlan,
      saveMealPlanEntry,
    }),
    [
      mealPlanEntries,
      mealPlanIsLoading,
      savingCount,
      initError,
      loadedRange,
      applyMealPlanBatch,
      clearMealPlanRange,
      deleteMealPlanEntry,
      loadMealPlan,
      refreshMealPlan,
      saveMealPlanEntry,
    ],
  );

  return <MealPlanContext.Provider value={value}>{children}</MealPlanContext.Provider>;
}

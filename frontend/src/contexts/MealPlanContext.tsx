import { useCallback, useMemo, useRef, useState } from "react";
import type { IProviderProps } from "../interfaces/IProviderProps";
import type { IMealPlanContext, IMealPlanRange } from "../interfaces/contexts/IMealPlanContext";
import { mealPlanService } from "../services";
import type { MealPlanBatchRequest, MealPlanEntryRequest } from "../services/mealPlanService";
import {
  acceptRangeResponse,
  emptyMealPlanCache,
  entriesInRange,
  isRangeLoaded,
  rangeKey,
  removeEntry,
  replaceRange,
  upsertEntry,
  type MealPlanCacheState,
} from "../utils/mealPlanCache";
import { getErrorMessage } from "./contextHelpers";
import { MealPlanContext } from "./contextHooks";

export function MealPlanProvider({ children }: IProviderProps) {
  const [cache, setCache] = useState<MealPlanCacheState>(emptyMealPlanCache);
  const [requestedRange, setRequestedRange] = useState<IMealPlanRange | null>(null);
  const [savingCount, setSavingCount] = useState(0);
  const [initError, setInitError] = useState<string | null>(null);
  const requestedRangeRef = useRef<IMealPlanRange | null>(null);
  const requestSequence = useRef(0);
  const appliedSequenceByRange = useRef(new Map<string, number>());
  // Changes when a write starts and when it ends, so a read that overlapped a write can be recognised.
  const writeEpoch = useRef(0);

  const fetchRange = useCallback(async (range: IMealPlanRange): Promise<void> => {
    const key = rangeKey(range);
    const isOnScreen = () =>
      requestedRangeRef.current !== null && rangeKey(requestedRangeRef.current) === key;

    // A response that may predate a write is asked for again (a few times at most) rather than shown.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const sequence = ++requestSequence.current;
      const epochAtStart = writeEpoch.current;

      try {
        const entries = await mealPlanService.getRange(range.from, range.to);
        const decision = acceptRangeResponse({
          requestSequence: sequence,
          latestAppliedSequence: appliedSequenceByRange.current.get(key),
          writeEpochAtStart: epochAtStart,
          writeEpochNow: writeEpoch.current,
        });

        if (decision === "refetch" && isOnScreen()) {
          continue;
        }

        if (decision === "apply") {
          appliedSequenceByRange.current.set(key, sequence);
          setCache((current) => replaceRange(current, range, entries));
          if (isOnScreen()) {
            setInitError(null);
          }
        }
      } catch (error) {
        if (isOnScreen()) {
          setInitError(getErrorMessage(error));
        }
      }

      return;
    }
  }, []);

  const loadMealPlan = useCallback(
    async (from: string, to: string) => {
      const range = { from, to };
      requestedRangeRef.current = range;
      setRequestedRange(range);
      // A range seen before is shown from the cache at once; this request revalidates it.
      await fetchRange(range);
    },
    [fetchRange],
  );

  const prefetchMealPlan = useCallback(
    async (from: string, to: string) => {
      if (!appliedSequenceByRange.current.has(rangeKey({ from, to }))) {
        await fetchRange({ from, to });
      }
    },
    [fetchRange],
  );

  const refreshMealPlan = useCallback(async () => {
    if (requestedRangeRef.current !== null) {
      await fetchRange(requestedRangeRef.current);
    }
  }, [fetchRange]);

  const runWrite = useCallback(async (write: () => Promise<void>) => {
    writeEpoch.current += 1;
    setSavingCount((count) => count + 1);

    // A failed write is reported by the caller; initError is only about loading.
    try {
      await write();
    } finally {
      writeEpoch.current += 1;
      setSavingCount((count) => count - 1);
    }
  }, []);

  const saveMealPlanEntry = useCallback(
    (id: number | null, entry: MealPlanEntryRequest) =>
      runWrite(async () => {
        if (entry.recipes.length === 0) {
          // The API refuses an empty new meal, and an empty existing one is simply removed.
          if (id !== null) {
            await mealPlanService.delete(id);
            setCache((current) => removeEntry(current, id));
          }
          return;
        }

        // The API returns the saved entry, so the week does not have to be fetched again.
        const saved = id === null ? await mealPlanService.create(entry) : await mealPlanService.update(id, entry);
        setCache((current) => upsertEntry(current, saved));
      }),
    [runWrite],
  );

  const deleteMealPlanEntry = useCallback(
    (id: number) =>
      runWrite(async () => {
        await mealPlanService.delete(id);
        setCache((current) => removeEntry(current, id));
      }),
    [runWrite],
  );

  const applyMealPlanBatch = useCallback(
    (request: MealPlanBatchRequest) =>
      runWrite(async () => {
        const result = await mealPlanService.batch(request);
        // The result holds every entry in from..to, so it replaces that part of the cache.
        setCache((current) => replaceRange(current, result, result.entries));
      }),
    [runWrite],
  );

  const clearMealPlanRange = useCallback(
    (from: string, to: string) => applyMealPlanBatch({ clearRange: { from, to } }),
    [applyMealPlanBatch],
  );

  const isRequestedRangeLoaded = requestedRange !== null && isRangeLoaded(cache, requestedRange);
  const mealPlanEntries = useMemo(
    () => (requestedRange === null ? [] : entriesInRange(cache.entries, requestedRange)),
    [cache.entries, requestedRange],
  );

  const value = useMemo<IMealPlanContext>(
    () => ({
      mealPlanEntries,
      // "Loading" means the requested range has nothing to show yet, never "a refresh is running".
      mealPlanIsLoading: !isRequestedRangeLoaded,
      mealPlanIsSaving: savingCount > 0,
      initError,
      loadedRange: isRequestedRangeLoaded ? requestedRange : null,
      applyMealPlanBatch,
      clearMealPlanRange,
      deleteMealPlanEntry,
      loadMealPlan,
      prefetchMealPlan,
      refreshMealPlan,
      saveMealPlanEntry,
    }),
    [
      mealPlanEntries,
      isRequestedRangeLoaded,
      savingCount,
      initError,
      requestedRange,
      applyMealPlanBatch,
      clearMealPlanRange,
      deleteMealPlanEntry,
      loadMealPlan,
      prefetchMealPlan,
      refreshMealPlan,
      saveMealPlanEntry,
    ],
  );

  return <MealPlanContext.Provider value={value}>{children}</MealPlanContext.Provider>;
}

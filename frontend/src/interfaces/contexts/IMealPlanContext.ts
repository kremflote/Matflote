import type { IMealPlanEntry } from "../IMeal";
import type { MealPlanBatchRequest, MealPlanEntryRequest } from "../../services/mealPlanService";

export interface IMealPlanContext {
  mealPlanEntries: IMealPlanEntry[];
  /** True while the requested range has never been shown; a refresh or a save keeps the current entries. */
  mealPlanIsLoading: boolean;
  /** True while a write is in flight. */
  mealPlanIsSaving: boolean;
  initError: string | null;
  /** The requested range once it has data on screen, otherwise null. */
  loadedRange: IMealPlanRange | null;
  /** Shows the range (from the cache at once when it was loaded before) and revalidates it. */
  loadMealPlan: (from: string, to: string) => Promise<void>;
  /** Loads a range into the cache without showing it, unless it was loaded before. */
  prefetchMealPlan: (from: string, to: string) => Promise<void>;
  refreshMealPlan: () => Promise<void>;
  /** Several changes in one request (generate, clear, move, swap); all of them or none. */
  applyMealPlanBatch: (request: MealPlanBatchRequest) => Promise<void>;
  clearMealPlanRange: (from: string, to: string) => Promise<void>;
  deleteMealPlanEntry: (id: number) => Promise<void>;
  saveMealPlanEntry: (id: number | null, entry: MealPlanEntryRequest) => Promise<void>;
}

export interface IMealPlanRange {
  from: string;
  to: string;
}

import type { IMealPlanEntry } from "../IMeal";
import type { MealPlanEntryRequest } from "../../services/mealPlanService";

export interface IMealPlanContext {
  mealPlanEntries: IMealPlanEntry[];
  /** True while the requested range has never been shown; a refresh or a save keeps the current entries. */
  mealPlanIsLoading: boolean;
  /** True while a write is in flight. */
  mealPlanIsSaving: boolean;
  initError: string | null;
  loadedRange: IMealPlanRange | null;
  loadMealPlan: (from: string, to: string) => Promise<void>;
  refreshMealPlan: () => Promise<void>;
  clearMealPlanRange: (from: string, to: string) => Promise<void>;
  deleteMealPlanEntry: (id: number) => Promise<void>;
  saveMealPlanEntry: (id: number | null, entry: MealPlanEntryRequest) => Promise<void>;
}

export interface IMealPlanRange {
  from: string;
  to: string;
}

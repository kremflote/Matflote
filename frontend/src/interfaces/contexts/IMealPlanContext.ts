import type { IMealPlanEntry } from "../IMeal";
import type { MealPlanEntryRequest } from "../../services/mealPlanService";

export interface IMealPlanContext {
  mealPlanEntries: IMealPlanEntry[];
  mealPlanIsLoading: boolean;
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

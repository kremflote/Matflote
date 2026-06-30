import type { IMealPlanEntry } from "../IMeal";

export interface IMealPlanContext {
  mealPlanEntries: IMealPlanEntry[];
  mealPlanIsLoading: boolean;
  initError: string | null;
  loadedRange: IMealPlanRange | null;
  loadMealPlan: (from: string, to: string) => Promise<void>;
  refreshMealPlan: () => Promise<void>;
}

export interface IMealPlanRange {
  from: string;
  to: string;
}

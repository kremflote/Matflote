import type { MeasurementUnit } from "../interfaces/IIngredient";
import type { IMealPlanEntry, MealRecipeRole, MealSlot } from "../interfaces/IMeal";
import { apiRequest } from "./apiClient";

export interface MealPlanRecipeRequest {
  recipeId: number | null;
  ingredientId: number | null;
  role: MealRecipeRole;
  sortOrder: number;
  portions: number | null;
  amount: number | null;
  unit: MeasurementUnit | null;
}

export interface MealPlanEntryRequest {
  date: string;
  slot: MealSlot;
  notes: string | null;
  recipes: MealPlanRecipeRequest[];
}

export const mealPlanService = {
  getRange: (from: string, to: string) => {
    const query = new URLSearchParams({ from, to });
    return apiRequest<IMealPlanEntry[]>(`/api/mealplans?${query.toString()}`);
  },
  getById: (id: number) => apiRequest<IMealPlanEntry>(`/api/mealplans/${id}`),
  create: (entry: MealPlanEntryRequest) =>
    apiRequest<IMealPlanEntry>("/api/mealplans", {
      method: "POST",
      body: entry,
    }),
  update: (id: number, entry: MealPlanEntryRequest) =>
    apiRequest<IMealPlanEntry>(`/api/mealplans/${id}`, {
      method: "PUT",
      body: entry,
    }),
  delete: (id: number) =>
    apiRequest<void>(`/api/mealplans/${id}`, {
      method: "DELETE",
    }),
};

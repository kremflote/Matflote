import type { IMealPlanEntry, MealRecipeRole, MealSlot } from "../interfaces/IMeal";
import { apiRequest } from "./apiClient";

export interface MealPlanRecipeRequest {
  recipeId: number;
  role: MealRecipeRole;
  sortOrder: number;
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
    apiRequest<void>(`/api/mealplans/${id}`, {
      method: "PUT",
      body: entry,
    }),
  delete: (id: number) =>
    apiRequest<void>(`/api/mealplans/${id}`, {
      method: "DELETE",
    }),
};

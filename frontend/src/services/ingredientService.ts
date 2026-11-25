import type { IIngredient, IngredientTag, INutritionFacts, NutritionDataSource } from "../interfaces/IIngredient";
import { apiRequest } from "./apiClient";

export interface IngredientRequest {
  ingredientName: string;
  description: string | null;
  brandId: number | null;
  imageUrl: string | null;
  tags: IngredientTag[];
  nutritionPer100: INutritionFacts | null;
  nutritionSource: NutritionDataSource;
  nutritionSourceLabel: string | null;
  matvaretabellenFoodId: string | null;
  nutritionMatchedName: string | null;
  nutritionMatchConfidence: number | null;
  color: string | null;
}

export const ingredientService = {
  getAll: () => apiRequest<IIngredient[]>("/api/ingredients"),
  getById: (id: number) => apiRequest<IIngredient>(`/api/ingredients/${id}`),
  create: (ingredient: IngredientRequest) =>
    apiRequest<IIngredient>("/api/ingredients", {
      method: "POST",
      body: ingredient,
    }),
  update: (id: number, ingredient: IngredientRequest) =>
    apiRequest<void>(`/api/ingredients/${id}`, {
      method: "PUT",
      body: ingredient,
    }),
  delete: (id: number) =>
    apiRequest<void>(`/api/ingredients/${id}`, {
      method: "DELETE",
    }),
};

import type { MeasurementUnit } from "../interfaces/IIngredient";
import type { IngredientPreparation, IRecipe, RecipeTag } from "../interfaces/IRecipe";
import { apiRequest } from "./apiClient";

export interface RecipeRequest {
  name: string;
  imageUrl: string | null;
  description: string | null;
  instructions: string | null;
  portions: number;
  ingredients: RecipeIngredientRequest[];
  tags: RecipeTag[];
  components: RecipeComponentRequest[];
}

export interface RecipeIngredientRequest {
  ingredientId: number;
  amount: number | null;
  unit: MeasurementUnit;
  preparation: IngredientPreparation;
}

export interface RecipeComponentRequest {
  recipeId: number;
  amount: number;
  unit: MeasurementUnit;
  preparation: IngredientPreparation;
  sortOrder: number;
}

export const recipeService = {
  getAll: () => apiRequest<IRecipe[]>("/api/recipes"),
  getById: (id: number) => apiRequest<IRecipe>(`/api/recipes/${id}`),
  create: (recipe: RecipeRequest) =>
    apiRequest<IRecipe>("/api/recipes", {
      method: "POST",
      body: recipe,
    }),
  update: (id: number, recipe: RecipeRequest) =>
    apiRequest<void>(`/api/recipes/${id}`, {
      method: "PUT",
      body: recipe,
    }),
  delete: (id: number) =>
    apiRequest<void>(`/api/recipes/${id}`, {
      method: "DELETE",
    }),
};

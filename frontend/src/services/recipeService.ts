import type { MeasurementUnit } from "../interfaces/IIngredient";
import type { DessertType, IngredientPreparation, IRecipe, RecipeTag, RecipeType } from "../interfaces/IRecipe";
import { apiRequest } from "./apiClient";

export interface RecipeRequest {
  recipeType: RecipeType;
  name: string;
  imageUrl: string | null;
  description: string | null;
  instructions: string | null;
  portions: number;
  ingredients: RecipeIngredientRequest[];
  tags: RecipeTag[];
  components: RecipeComponentRequest[];
  dessertType: DessertType | null;
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
  getAll: (type?: RecipeType) => {
    const query = type ? `?type=${encodeURIComponent(type)}` : "";
    return apiRequest<IRecipe[]>(`/api/recipes${query}`);
  },
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

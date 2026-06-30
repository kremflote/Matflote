import type { IRecipe, RecipeType } from "../interfaces/IRecipe";
import { apiRequest } from "./apiClient";

export interface RecipeRequest {
  recipeType: RecipeType;
  name: string;
  imageUrl: string | null;
  description: string | null;
  instructions: string | null;
  ingredientIds: number[];
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

import type { IIngredient } from "../interfaces/IIngredient";
import { apiRequest } from "./apiClient";

export type IngredientRequest = Omit<IIngredient, "ingredientId">;

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

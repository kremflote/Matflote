import type { IIngredientPricePoint } from "../interfaces/IIngredientPrice";
import { apiRequest } from "./apiClient";

export interface IngredientPricePointRequest {
  ingredientId: number;
  storeId: number;
  price: number;
  date: string;
  note: string | null;
}

export const ingredientPriceService = {
  getAll: () => apiRequest<IIngredientPricePoint[]>("/api/ingredient-price-points"),
  getByIngredient: (ingredientId: number) =>
    apiRequest<IIngredientPricePoint[]>(`/api/ingredient-price-points?ingredientId=${ingredientId}`),
  create: (pricePoint: IngredientPricePointRequest) =>
    apiRequest<IIngredientPricePoint>("/api/ingredient-price-points", {
      method: "POST",
      body: pricePoint,
    }),
  delete: (id: number) =>
    apiRequest<void>(`/api/ingredient-price-points/${id}`, {
      method: "DELETE",
    }),
};

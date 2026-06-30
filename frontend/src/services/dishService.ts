import type { Cuisine, DishType, IDish } from "../interfaces/IDish";
import { apiRequest } from "./apiClient";

export interface DishRequest {
  name: string;
  imageUrl: string | null;
  description: string | null;
  instructions: string | null;
  ingredientIds: number[];
  types: DishType[];
  cuisine: Cuisine;
}

export const dishService = {
  getAll: () => apiRequest<IDish[]>("/api/dishes"),
  getById: (id: number) => apiRequest<IDish>(`/api/dishes/${id}`),
  create: (dish: DishRequest) =>
    apiRequest<IDish>("/api/dishes", {
      method: "POST",
      body: dish,
    }),
  update: (id: number, dish: DishRequest) =>
    apiRequest<void>(`/api/dishes/${id}`, {
      method: "PUT",
      body: dish,
    }),
  delete: (id: number) =>
    apiRequest<void>(`/api/dishes/${id}`, {
      method: "DELETE",
    }),
};

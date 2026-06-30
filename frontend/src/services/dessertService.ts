import type { DessertType, IDessert } from "../interfaces/IDessert";
import { apiRequest } from "./apiClient";

export interface DessertRequest {
  name: string;
  imageUrl: string | null;
  description: string | null;
  instructions: string | null;
  ingredientIds: number[];
  type: DessertType;
}

export const dessertService = {
  getAll: () => apiRequest<IDessert[]>("/api/desserts"),
  getById: (id: number) => apiRequest<IDessert>(`/api/desserts/${id}`),
  create: (dessert: DessertRequest) =>
    apiRequest<IDessert>("/api/desserts", {
      method: "POST",
      body: dessert,
    }),
  update: (id: number, dessert: DessertRequest) =>
    apiRequest<void>(`/api/desserts/${id}`, {
      method: "PUT",
      body: dessert,
    }),
  delete: (id: number) =>
    apiRequest<void>(`/api/desserts/${id}`, {
      method: "DELETE",
    }),
};

import type { ICuisine } from "../interfaces/ILookup";
import { apiRequest } from "./apiClient";
import type { LookupRequest } from "./brandService";

export const cuisineService = {
  getAll: () => apiRequest<ICuisine[]>("/api/cuisines"),
  create: (cuisine: LookupRequest) =>
    apiRequest<ICuisine>("/api/cuisines", {
      method: "POST",
      body: cuisine,
    }),
  delete: (id: number) =>
    apiRequest<void>(`/api/cuisines/${id}`, {
      method: "DELETE",
    }),
};

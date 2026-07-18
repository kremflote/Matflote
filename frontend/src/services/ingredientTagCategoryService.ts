import type { IIngredientTagCategory } from "../interfaces/ILookup";
import { apiRequest } from "./apiClient";
import type { LookupRequest } from "./brandService";

export const ingredientTagCategoryService = {
  getAll: () => apiRequest<IIngredientTagCategory[]>("/api/ingredient-tag-categories"),
  create: (category: LookupRequest) =>
    apiRequest<IIngredientTagCategory>("/api/ingredient-tag-categories", {
      method: "POST",
      body: category,
    }),
  createTag: (categoryId: number, tag: LookupRequest) =>
    apiRequest<IIngredientTagCategory>(`/api/ingredient-tag-categories/${categoryId}/tags`, {
      method: "POST",
      body: tag,
    }),
  update: (id: number, category: LookupRequest) =>
    apiRequest<IIngredientTagCategory>(`/api/ingredient-tag-categories/${id}`, {
      method: "PUT",
      body: category,
    }),
  updateTag: (tagName: string, tag: LookupRequest) =>
    apiRequest<void>(`/api/ingredient-tag-categories/tags/${encodeURIComponent(tagName)}`, {
      method: "PUT",
      body: tag,
    }),
  deleteTag: (tagName: string) =>
    apiRequest<void>(`/api/ingredient-tag-categories/tags/${encodeURIComponent(tagName)}`, {
      method: "DELETE",
    }),
  delete: (id: number) =>
    apiRequest<void>(`/api/ingredient-tag-categories/${id}`, {
      method: "DELETE",
    }),
};

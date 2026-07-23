import type { IRecipeTagCategory } from "../interfaces/ILookup";
import { apiRequest } from "./apiClient";
import type { LookupRequest } from "./brandService";

export const recipeTagCategoryService = {
  getAll: () => apiRequest<IRecipeTagCategory[]>("/api/recipe-tag-categories"),
  create: (category: LookupRequest) =>
    apiRequest<IRecipeTagCategory>("/api/recipe-tag-categories", {
      method: "POST",
      body: category,
    }),
  createTag: (categoryId: number, tag: LookupRequest) =>
    apiRequest<IRecipeTagCategory>(`/api/recipe-tag-categories/${categoryId}/tags`, {
      method: "POST",
      body: tag,
    }),
  update: (id: number, category: LookupRequest) =>
    apiRequest<IRecipeTagCategory>(`/api/recipe-tag-categories/${id}`, {
      method: "PUT",
      body: category,
    }),
  updateTag: (tagName: string, tag: LookupRequest) =>
    apiRequest<void>(`/api/recipe-tag-categories/tags/${encodeURIComponent(tagName)}`, {
      method: "PUT",
      body: tag,
    }),
  deleteTag: (tagName: string) =>
    apiRequest<void>(`/api/recipe-tag-categories/tags/${encodeURIComponent(tagName)}`, {
      method: "DELETE",
    }),
  delete: (id: number) =>
    apiRequest<void>(`/api/recipe-tag-categories/${id}`, {
      method: "DELETE",
    }),
};

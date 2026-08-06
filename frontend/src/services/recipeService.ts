import type { MeasurementUnit } from "../interfaces/IIngredient";
import type { IngredientPreparation, IRecipe, RecipeTag } from "../interfaces/IRecipe";
import { API_BASE_URL, ApiError, apiRequest } from "./apiClient";

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
  downloadPdf: async (id: number, language: string) => {
    const response = await fetch(`${API_BASE_URL}/api/recipes/${id}/pdf?language=${encodeURIComponent(language)}`);

    if (!response.ok) {
      throw new ApiError(await response.text(), response.status);
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get("Content-Disposition") ?? "";
    const fileName = getFileNameFromContentDisposition(contentDisposition) ?? `matflote-recipe-${id}.pdf`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
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

function getFileNameFromContentDisposition(contentDisposition: string) {
  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].replace(/"/g, ""));
  }

  const fallbackMatch = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return fallbackMatch?.[1] ?? null;
}

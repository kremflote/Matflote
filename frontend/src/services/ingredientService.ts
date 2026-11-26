import type {
  IIngredient,
  IIngredientInUse,
  IIngredientReplacementResult,
  IngredientTag,
  INutritionFacts,
  NutritionDataSource,
} from "../interfaces/IIngredient";
import { ApiError, apiRequest } from "./apiClient";

export interface IngredientRequest {
  ingredientName: string;
  description: string | null;
  brandId: number | null;
  imageUrl: string | null;
  tags: IngredientTag[];
  nutritionPer100: INutritionFacts | null;
  nutritionSource: NutritionDataSource;
  nutritionSourceLabel: string | null;
  matvaretabellenFoodId: string | null;
  nutritionMatchedName: string | null;
  nutritionMatchConfidence: number | null;
  color: string | null;
}

export const ingredientService = {
  getAll: () => apiRequest<IIngredient[]>("/api/ingredients"),
  getById: (id: number) => apiRequest<IIngredient>(`/api/ingredients/${id}`),
  create: (ingredient: IngredientRequest) =>
    apiRequest<IIngredient>("/api/ingredients", {
      method: "POST",
      body: ingredient,
    }),
  update: (id: number, ingredient: IngredientRequest) =>
    apiRequest<IIngredient>(`/api/ingredients/${id}`, {
      method: "PUT",
      body: ingredient,
    }),
  /** Fails with an ApiError of status 409 when recipes or planned meals use the ingredient; see getIngredientInUse. */
  delete: (id: number) =>
    apiRequest<void>(`/api/ingredients/${id}`, {
      method: "DELETE",
    }),
  /** Moves every use of the ingredient to another one, then deletes it. */
  replaceWith: (id: number, otherId: number) =>
    apiRequest<IIngredientReplacementResult>(`/api/ingredients/${id}/replace-with/${otherId}`, {
      method: "POST",
    }),
};

/** The uses listed by a 409 from delete, or null for any other error. */
export function getIngredientInUse(error: unknown): IIngredientInUse | null {
  if (!(error instanceof ApiError) || error.status !== 409 || typeof error.body !== "object" || error.body === null) {
    return null;
  }

  const body = error.body as Partial<IIngredientInUse>;
  return Array.isArray(body.recipes) && Array.isArray(body.mealPlanEntries)
    ? { error: error.message, recipes: body.recipes, mealPlanEntries: body.mealPlanEntries }
    : null;
}

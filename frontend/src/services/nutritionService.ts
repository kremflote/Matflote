import type {
  INutritionPreference,
  INutritionReferenceImportResult,
  INutritionSummary,
} from "../interfaces/INutrition";
import { apiRequest } from "./apiClient";

export const nutritionService = {
  getWeeklySummary: (from: string, to: string, profileId: string) =>
    apiRequest<INutritionSummary>(
      `/api/nutrition/weekly?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&profileId=${encodeURIComponent(profileId)}`,
    ),
  getProfilePreference: () => apiRequest<INutritionPreference>("/api/nutrition/profile-preference"),
  updateProfilePreference: (profileId: string | null, peopleEating: number) =>
    apiRequest<INutritionPreference>("/api/nutrition/profile-preference", {
      method: "PUT",
      body: { profileId, peopleEating },
    }),
  importReferenceValues: () =>
    apiRequest<INutritionReferenceImportResult>("/api/nutrition/reference-values/import", {
      method: "POST",
    }),
};

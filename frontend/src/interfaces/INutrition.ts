export interface INutritionSummary {
  from: string;
  to: string;
  profile: INutritionProfile;
  profiles: INutritionProfile[];
  dailyCalories: IDailyCalories[];
  items: INutritionSummaryItem[];
  missingNutritionIngredients: IMissingNutritionIngredient[];
  referenceSource: INutritionReferenceSource | null;
}

export interface IDailyCalories {
  date: string;
  calories: number | null;
}

export interface INutritionProfile {
  profileId: string;
  label: string;
  gender: string;
  minAge: number;
  maxAge: number | null;
}

export interface INutritionSummaryItem {
  key: string;
  label: string;
  total: number | null;
  unit: string;
  recommendedWeekly: number | null;
  percentOfRecommended: number | null;
  coveragePercent: number | null;
  targetType: string;
  status: string;
}

export interface INutritionReferenceSource {
  provider: string;
  sourceUrl: string;
  sourceUpdatedAt: string | null;
  importedAt: string;
  valueType: string;
}

export interface IMissingNutritionIngredient {
  ingredientId: number;
  ingredientName: string;
  brandName: string | null;
  sourceRecipes: string[];
}

export interface INutritionPreference {
  profileId: string | null;
  peopleEating: number;
}

export interface INutritionReferenceImportResult {
  status: string;
  message: string;
  profilesImported: number;
  importedAt: string;
}

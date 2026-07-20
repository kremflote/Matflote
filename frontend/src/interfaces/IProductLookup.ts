export interface IProductLookupResponse {
  ean: string;
  products: IProductLookupResult[];
}

export interface IProductLookupResult {
  ean: string;
  name: string;
  brand: string | null;
  vendor: string | null;
  description: string | null;
  ingredients: string | null;
  imageUrl: string | null;
  currentPrice: number | null;
  currentUnitPrice: number | null;
  weight: number | null;
  weightUnit: string | null;
  store: IProductLookupStore | null;
  kassalappUrl: string | null;
  kassalappNutritionPer100: IProductLookupNutrition | null;
  matvaretabellenNutritionPer100: IProductLookupNutrition | null;
  nutritionPer100: IProductLookupNutrition | null;
  nutritionSource: ProductLookupNutritionSource;
  nutritionSupplementSource: ProductLookupNutritionSource | null;
  matvaretabellenSupplementAttempted: boolean;
  matvaretabellenSupplementStatus: "NotAttempted" | "Matched" | "NoMatch";
  matvaretabellenCandidates: IMatvaretabellenCandidate[];
  nutritionSourceLabel: string | null;
  matvaretabellenFoodId: string | null;
  matvaretabellenUrl: string | null;
  nutritionMatchedName: string | null;
  nutritionMatchConfidence: number | null;
  source: string;
}

export interface IMatvaretabellenCandidate {
  foodId: string;
  foodName: string;
  url: string | null;
  confidence: number;
  nutrition: IProductLookupNutrition;
}

export type ProductLookupNutritionSource =
  | "None"
  | "Matvaretabellen"
  | "Kassalapp"
  | "Manual";

export interface IProductLookupStore {
  name: string;
  url: string | null;
  logo: string | null;
}

export interface IProductLookupNutrition {
  calories: number | null;
  carbohydrateGrams: number | null;
  proteinGrams: number | null;
  saltGrams: number | null;
  dietaryFiberGrams: number | null;
  saturatedFatGrams: number | null;
  transFatGrams: number | null;
  monounsaturatedFatGrams: number | null;
  polyunsaturatedFatGrams: number | null;
  omega3Grams: number | null;
  omega6Grams: number | null;
  cholesterolMilligrams: number | null;
  vitaminAMicrograms: number | null;
  vitaminB9Micrograms: number | null;
  vitaminB12Micrograms: number | null;
  vitaminCMilligrams: number | null;
  vitaminDMicrograms: number | null;
  vitaminEMilligrams: number | null;
  vitaminKMicrograms: number | null;
  cholineMilligrams: number | null;
}

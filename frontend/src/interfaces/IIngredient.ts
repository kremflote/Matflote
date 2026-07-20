import type { IBrand } from "./ILookup";

export interface IIngredient {
  ingredientId: number;
  ingredientName: string;
  description: string | null;
  brandId: number | null;
  brand: IBrand | null;
  imageUrl: string | null;
  price: number | null;
  tags: IngredientTag[];
  nutritionPer100: INutritionFacts | null;
  nutritionSource: NutritionDataSource;
  nutritionSourceLabel: string | null;
  matvaretabellenFoodId: string | null;
  nutritionMatchedName: string | null;
  nutritionMatchConfidence: number | null;
  color: string | null;
}

export type KnownIngredientTag =
  | "Vegetable"
  | "Fruit"
  | "Chicken"
  | "Fish"
  | "Beef"
  | "Lamb"
  | "Mince"
  | "Dairy"
  | "Grain"
  | "Spice"
  | "Herb"
  | "Sauce"
  | "Pantry"
  | "Frozen"
  | "LeafyGreen"
  | "Berry"
  | "RootVegetable"
  | "Bread"
  | "Dip";

export type IngredientTag = KnownIngredientTag | (string & {});

export interface INutritionFacts {
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
  vitamins: Vitamin[];
}

export type Vitamin =
  | "VitaminA"
  | "VitaminB9"
  | "VitaminB12"
  | "VitaminC"
  | "VitaminD"
  | "VitaminE"
  | "VitaminK"
  | "Choline";

export type NutritionDataSource =
  | "None"
  | "Matvaretabellen"
  | "Kassalapp"
  | "Manual";

export type MeasurementUnit =
  | "Gram"
  | "Kilogram"
  | "Milliliter"
  | "Liter";

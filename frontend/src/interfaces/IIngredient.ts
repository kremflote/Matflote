import type { IBrand } from "./ILookup";

export interface IIngredient {
  ingredientId: number;
  ingredientName: string;
  description: string | null;
  brandId: number | null;
  brand: IBrand | null;
  price: number | null;
  tags: IngredientTag[];
  nutritionPer100: INutritionFacts | null;
  color: string | null;
}

export type IngredientTag =
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
  | "Other"
  | "LeafyGreen";

export interface INutritionFacts {
  calories: number | null;
  carbohydrateGrams: number | null;
  proteinGrams: number | null;
  saltGrams: number | null;
  dietaryFiberGrams: number | null;
  saturatedFatGrams: number | null;
  unsaturatedFatGrams: number | null;
  monounsaturatedFatGrams: number | null;
  polyunsaturatedFatGrams: number | null;
  vitamins: Vitamin[];
}

export type Vitamin =
  | "VitaminA"
  | "VitaminB"
  | "VitaminB12"
  | "VitaminC"
  | "VitaminD"
  | "VitaminE"
  | "VitaminK";

export type MeasurementUnit =
  | "Gram"
  | "Kilogram"
  | "Milliliter"
  | "Liter"
  | "Teaspoon"
  | "Tablespoon"
  | "Cup"
  | "Piece"
  | "Clove"
  | "Pinch"
  | "ToTaste";

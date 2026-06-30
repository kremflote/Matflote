export interface IIngredient {
  ingredientId: number;
  ingredientName: string;
  brand: string | null;
  price: number | null;
  amount: number | null;
  unit: MeasurementUnit | null;
  category: IngredientCategory;
  nutritionPer100: INutritionFacts | null;
  color: string | null;
}

export type IngredientCategory =
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
  | "Other";

export interface INutritionFacts {
  calories: number | null;
  vitamins: string | null;
  dietaryFiberGrams: number | null;
}

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

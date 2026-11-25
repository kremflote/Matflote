import type { MealSlot } from "./IMeal";
import type { IBrand } from "./ILookup";

export interface IIngredient {
  ingredientId: number;
  ingredientName: string;
  description: string | null;
  brandId: number | null;
  brand: IBrand | null;
  imageUrl: string | null;
  /** A small version of the image for grids and cards; null until one has been made. */
  thumbnailUrl: string | null;
  tags: IngredientTag[];
  nutritionPer100: INutritionFacts | null;
  nutritionSource: NutritionDataSource;
  nutritionSourceLabel: string | null;
  matvaretabellenFoodId: string | null;
  nutritionMatchedName: string | null;
  nutritionMatchConfidence: number | null;
  color: string | null;
}

/** The 409 body of DELETE /api/ingredients/{id}: what still uses the ingredient. */
export interface IIngredientInUse {
  error: string;
  recipes: { recipeId: number; name: string }[];
  mealPlanEntries: { mealPlanEntryId: number; date: string; slot: MealSlot }[];
}

export interface IIngredientReplacementResult {
  deletedIngredientId: number;
  replacement: IIngredient;
  recipeLinesMoved: number;
  recipeLinesMerged: number;
  mealPlanItemsMoved: number;
}

export type KnownTag =
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
  | "Frozen"
  | "LeafyGreen"
  | "Berry"
  | "RootVegetable"
  | "Bread"
  | "Dip"
  | "Breakfast"
  | "Lunch"
  | "Dinner"
  | "Dish"
  | "Side"
  | "Dessert"
  | "Bowl"
  | "Grill"
  | "Pasta"
  | "Vegetarian"
  | "Soup"
  | "Stew"
  | "Salad"
  | "Pizza"
  | "Sandwich"
  | "Casserole"
  | "Porridge"
  | "Plate"
  | "SousVide"
  | "SpiceMix";

export type Tag = KnownTag | (string & {});
export type IngredientTag = Tag;

export interface INutritionFacts {
  calories: number | null;
  carbohydrateGrams: number | null;
  proteinGrams: number | null;
  fatGrams: number | null;
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
  vitamins: Vitamin[];
}

export type Vitamin =
  | "VitaminA"
  | "VitaminB9"
  | "VitaminB12"
  | "VitaminC"
  | "VitaminD"
  | "VitaminE";

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

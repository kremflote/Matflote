import type { IngredientTag, MeasurementUnit, Tag } from "./IIngredient";
import type { IBrand } from "./ILookup";

export interface IRecipe {
  recipeId: number;
  name: string;
  imageUrl: string | null;
  description: string | null;
  instructions: string | null;
  portions: number;
  ingredients: IRecipeIngredient[];
  tags: RecipeTag[];
  components: IRecipeComponent[];
}

/** A component recipe by reference; its ingredients are in its own entry of the recipe list. */
export interface IRecipeComponent {
  recipeId: number;
  name: string;
  amount: number;
  unit: MeasurementUnit;
  preparation: IngredientPreparation;
  sortOrder: number;
}

/**
 * The parts of an ingredient the recipe list carries. For the description, nutrition and the rest,
 * look the ingredient up by id in `useIngredients()`.
 */
export interface IRecipeIngredientSummary {
  ingredientId: number;
  ingredientName: string;
  brand: IBrand | null;
  imageUrl: string | null;
  tags: IngredientTag[];
  color: string | null;
}

export interface IRecipeIngredient {
  recipeIngredientId: number;
  ingredient: IRecipeIngredientSummary;
  amount: number | null;
  unit: MeasurementUnit;
  preparation: IngredientPreparation;
}

export type IngredientPreparation =
  | "None"
  | "Quartered"
  | "Wedged"
  | "Chopped"
  | "RoughlyChopped"
  | "FinelyChopped"
  | "Diced"
  | "Cubed"
  | "Julienned"
  | "Batons"
  | "Sliced"
  | "Minced"
  | "Grated"
  | "Shredded"
  | "Crushed";

export type RecipeTag = Tag;

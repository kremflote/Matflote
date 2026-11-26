import type { IngredientTag, MeasurementUnit, Tag } from "./IIngredient";
import type { IBrand } from "./ILookup";

export interface IRecipe {
  recipeId: number;
  name: string;
  imageUrl: string | null;
  /** A small version of the image for grids and cards; null until one has been made. */
  thumbnailUrl: string | null;
  description: string | null;
  instructions: string | null;
  portions: number;
  ingredients: IRecipeIngredient[];
  tags: RecipeTag[];
  components: IRecipeComponent[];
  /** The household's rating, 1 to 5; null until rated. */
  rating: number | null;
  ratingNote: string | null;
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
  thumbnailUrl: string | null;
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

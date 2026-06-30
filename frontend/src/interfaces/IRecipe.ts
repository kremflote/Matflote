import type { IIngredient } from "./IIngredient";

export interface IRecipe {
  recipeId: number;
  recipeType: RecipeType;
  name: string;
  imageUrl: string | null;
  description: string | null;
  instructions: string | null;
  ingredients: IIngredient[];
}

export type RecipeType =
  | "Dish"
  | "Dessert"
  | "Sauce"
  | "Dip"
  | "Side"
  | "SpiceMix";

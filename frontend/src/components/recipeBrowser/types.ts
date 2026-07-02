import type { IIngredient } from "../../interfaces/IIngredient";
import type { IRecipe } from "../../interfaces/IRecipe";

export type BrowserMode = "recipes" | "ingredients";

export type BrowserAddTarget = "recipe" | "ingredient";

export type EnrichedRecipe = IRecipe;

export type BrowserDetail =
  | { kind: "recipe"; recipe: EnrichedRecipe }
  | { kind: "ingredient"; ingredient: IIngredient };

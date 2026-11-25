import type { IIngredient } from "../../interfaces/IIngredient";
import type { IRecipe } from "../../interfaces/IRecipe";

export type BrowserMode = "recipes" | "ingredients";

export type BrowserAddTarget = "recipe" | "ingredient";

export type EnrichedRecipe = IRecipe;

export type BrowserDetail =
  | { kind: "recipe"; recipe: EnrichedRecipe }
  | { kind: "ingredient"; ingredient: IIngredient };

/** Names a recipe or ingredient by id, so a refreshed list does not count as a different one. */
export type BrowserDetailKey =
  | { kind: "recipe"; id: number }
  | { kind: "ingredient"; id: number };

export function toBrowserDetailKey(detail: BrowserDetail): BrowserDetailKey {
  return detail.kind === "recipe"
    ? { kind: "recipe", id: detail.recipe.recipeId }
    : { kind: "ingredient", id: detail.ingredient.ingredientId };
}

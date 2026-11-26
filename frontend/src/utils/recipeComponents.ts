import type { IRecipe, IRecipeIngredient } from "../interfaces/IRecipe";

/**
 * A recipe's own ingredient lines followed by the lines of its direct components.
 * The recipe list only carries components by id, so their lines are looked up in the list itself.
 */
export function getRecipeAndComponentLines(
  recipe: IRecipe,
  recipesById: ReadonlyMap<number, IRecipe>,
): IRecipeIngredient[] {
  return [
    ...recipe.ingredients,
    ...recipe.components.flatMap((component) => recipesById.get(component.recipeId)?.ingredients ?? []),
  ];
}

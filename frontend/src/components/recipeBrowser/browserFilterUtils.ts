import type { IIngredient, IngredientTag } from "../../interfaces/IIngredient";
import type { RecipeTag } from "../../interfaces/IRecipe";
import { getRecipeAndComponentLines } from "../../utils/recipeComponents";
import type { EnrichedRecipe } from "./types";

export function matchesRecipeSearch(recipe: EnrichedRecipe, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (normalizedSearch.length === 0) {
    return true;
  }

  const searchableText = [
    recipe.name,
    recipe.description,
    recipe.instructions,
    ...recipe.tags,
    ...recipe.ingredients.map((recipeIngredient) => recipeIngredient.ingredient.ingredientName),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedSearch);
}

export function matchesIngredientSearch(ingredient: IIngredient, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (normalizedSearch.length === 0) {
    return true;
  }

  const searchableText = [
    ingredient.ingredientName,
    ...ingredient.tags,
    ingredient.brand?.name,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedSearch);
}

export function matchesSelectedIngredients(
  recipe: EnrichedRecipe,
  selectedIngredientIds: number[],
  recipesById: ReadonlyMap<number, EnrichedRecipe>,
) {
  if (selectedIngredientIds.length === 0) {
    return true;
  }

  const lines = getRecipeAndComponentLines(recipe, recipesById);
  return selectedIngredientIds.every((ingredientId) =>
    lines.some((recipeIngredient) => recipeIngredient.ingredient.ingredientId === ingredientId),
  );
}

export function matchesRecipeTags(
  recipe: EnrichedRecipe,
  selectedRecipeTags: RecipeTag[],
  recipesById: ReadonlyMap<number, EnrichedRecipe>,
) {
  if (selectedRecipeTags.length === 0) {
    return true;
  }

  return selectedRecipeTags.every((selectedTag) => recipeHasTag(recipe, selectedTag, recipesById));
}

export function matchesIngredientTags(
  ingredient: IIngredient,
  selectedIngredientTags: IngredientTag[],
) {
  if (selectedIngredientTags.length === 0) {
    return true;
  }

  return selectedIngredientTags.every((selectedTag) => ingredient.tags.includes(selectedTag));
}

function recipeHasTag(recipe: EnrichedRecipe, selectedTag: RecipeTag, recipesById: ReadonlyMap<number, EnrichedRecipe>) {
  return (
    recipe.tags.includes(selectedTag) ||
    getRecipeAndComponentLines(recipe, recipesById).some((recipeIngredient) =>
      recipeIngredient.ingredient.tags.includes(selectedTag),
    )
  );
}

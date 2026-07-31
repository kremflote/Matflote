import type { IIngredient, IngredientTag } from "../../interfaces/IIngredient";
import type { RecipeTag } from "../../interfaces/IRecipe";
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

export function matchesSelectedIngredients(recipe: EnrichedRecipe, selectedIngredientIds: number[]) {
  if (selectedIngredientIds.length === 0) {
    return true;
  }

  return recipe.ingredients.some((recipeIngredient) =>
    selectedIngredientIds.includes(recipeIngredient.ingredient.ingredientId),
  );
}

export function matchesRecipeTags(recipe: EnrichedRecipe, selectedRecipeTags: RecipeTag[]) {
  if (selectedRecipeTags.length === 0) {
    return true;
  }

  return selectedRecipeTags.every((selectedTag) => recipeHasTag(recipe, selectedTag));
}

export function matchesIngredientTags(
  ingredient: IIngredient,
  selectedIngredientTags: IngredientTag[],
) {
  if (selectedIngredientTags.length === 0) {
    return true;
  }

  return ingredient.tags.some((tag) => selectedIngredientTags.includes(tag));
}

function recipeHasTag(recipe: EnrichedRecipe, selectedTag: RecipeTag) {
  if (recipe.tags.includes(selectedTag)) {
    return true;
  }

  if (
    recipe.ingredients.some((recipeIngredient) =>
      recipeIngredient.ingredient.tags.includes(selectedTag),
    )
  ) {
    return true;
  }

  return recipe.components.some((component) =>
    component.ingredients?.some((recipeIngredient) =>
      recipeIngredient.ingredient.tags.includes(selectedTag),
    ) ?? false,
  );
}

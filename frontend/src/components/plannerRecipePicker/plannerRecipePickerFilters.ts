import type { Dispatch, SetStateAction } from "react";
import type { IIngredient, IngredientTag } from "../../interfaces/IIngredient";
import type { MealRecipeRole } from "../../interfaces/IMeal";
import type { IRecipe, RecipeTag } from "../../interfaces/IRecipe";
import { ingredientTags } from "../recipeBrowser/formOptions";
import { getRecipeAndComponentLines } from "../../utils/recipeComponents";

export const mainProteinFilters: IngredientTag[] = ingredientTags.filter(
  (ingredientTag) =>
    ingredientTag === "Chicken" ||
    ingredientTag === "Fish" ||
    ingredientTag === "Beef" ||
    ingredientTag === "Lamb" ||
    ingredientTag === "Mince",
);

export const maxSupplementaryItems = 6;

export function toggleSelection<TValue extends string | number>(
  value: TValue,
  setSelectedValues: Dispatch<SetStateAction<TValue[]>>,
) {
  setSelectedValues((selectedValues) =>
    selectedValues.includes(value)
      ? selectedValues.filter((selectedValue) => selectedValue !== value)
      : [...selectedValues, value],
  );
}

export function isMainDish(recipe: IRecipe) {
  return recipe.recipeId > 0;
}

export function matchesSelectedIngredients(
  recipe: IRecipe,
  selectedIngredientIds: number[],
  recipesById: ReadonlyMap<number, IRecipe>,
) {
  if (selectedIngredientIds.length === 0) {
    return true;
  }

  const lines = getRecipeAndComponentLines(recipe, recipesById);
  return selectedIngredientIds.every((ingredientId) =>
    lines.some((recipeIngredient) => recipeIngredient.ingredient.ingredientId === ingredientId),
  );
}

export function matchesSelectedIngredientTags(
  recipe: IRecipe,
  selectedIngredientTags: IngredientTag[],
  recipesById: ReadonlyMap<number, IRecipe>,
) {
  if (selectedIngredientTags.length === 0) {
    return true;
  }

  return selectedIngredientTags.every((ingredientTag) => recipeHasIngredientTag(recipe, ingredientTag, recipesById));
}

/** Meal-time tags are alternatives: a lunch slot offers recipes tagged Lunch or Dinner. */
export const mealTimeRecipeTags: readonly RecipeTag[] = ["Breakfast", "Lunch", "Dinner"];

/**
 * A recipe matches when it has at least one of the selected meal-time tags (if any are selected)
 * and every other selected tag.
 */
export function matchesSelectedRecipeTags(recipe: IRecipe, selectedRecipeTags: RecipeTag[]) {
  const selectedMealTimeTags = selectedRecipeTags.filter((recipeTag) => mealTimeRecipeTags.includes(recipeTag));
  const otherSelectedTags = selectedRecipeTags.filter((recipeTag) => !mealTimeRecipeTags.includes(recipeTag));

  return (
    (selectedMealTimeTags.length === 0 || selectedMealTimeTags.some((recipeTag) => recipe.tags.includes(recipeTag))) &&
    otherSelectedTags.every((recipeTag) => recipe.tags.includes(recipeTag))
  );
}

export function matchesSearch(recipe: IRecipe, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (normalizedSearch.length === 0) {
    return true;
  }

  return [
    recipe.name,
    ...recipe.tags,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
}

export function matchesIngredientSearch(ingredient: IIngredient, searchTerm: string) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (normalizedSearch.length === 0) {
    return true;
  }

  return [
    ingredient.ingredientName,
    ...ingredient.tags,
    ingredient.brand?.name,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
}

export function recipeHasIngredientTag(
  recipe: IRecipe,
  ingredientTag: IngredientTag,
  recipesById: ReadonlyMap<number, IRecipe>,
) {
  return getRecipeAndComponentLines(recipe, recipesById).some((recipeIngredient) =>
    recipeIngredient.ingredient.tags.includes(ingredientTag),
  );
}

export function getSupplementaryRole(recipe: IRecipe): MealRecipeRole {
  if (recipe.tags.includes("Sauce") || recipe.tags.includes("Dip")) {
    return "Sauce";
  }

  if (recipe.tags.includes("Side") || recipe.tags.includes("Salad")) {
    return "Side";
  }

  return "Extra";
}

import type { Dispatch, SetStateAction } from "react";
import type { IIngredient, IngredientTag } from "../../interfaces/IIngredient";
import type { MealRecipeRole } from "../../interfaces/IMeal";
import type { IRecipe, RecipeTag } from "../../interfaces/IRecipe";
import { ingredientTags } from "../recipeBrowser/formOptions";

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

export function matchesSelectedIngredients(recipe: IRecipe, selectedIngredientIds: number[]) {
  if (selectedIngredientIds.length === 0) {
    return true;
  }

  return recipe.ingredients.some((recipeIngredient) =>
    selectedIngredientIds.includes(recipeIngredient.ingredient.ingredientId),
  );
}

export function matchesSelectedIngredientTags(recipe: IRecipe, selectedIngredientTags: IngredientTag[]) {
  if (selectedIngredientTags.length === 0) {
    return true;
  }

  return selectedIngredientTags.some((ingredientTag) => recipeHasIngredientTag(recipe, ingredientTag));
}

export function matchesSelectedRecipeTags(recipe: IRecipe, selectedRecipeTags: RecipeTag[]) {
  if (selectedRecipeTags.length === 0) {
    return true;
  }

  return recipe.tags.some((recipeTag) => selectedRecipeTags.includes(recipeTag));
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

export function recipeHasIngredientTag(recipe: IRecipe, ingredientTag: IngredientTag) {
  return recipe.ingredients.some((recipeIngredient) =>
    recipeIngredient.ingredient.tags
      .includes(ingredientTag),
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

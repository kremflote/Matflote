import type { Dispatch, SetStateAction } from "react";
import type { IIngredient, IngredientTag } from "../../interfaces/IIngredient";
import type { MealRecipeRole } from "../../interfaces/IMeal";
import type { IRecipe, RecipeTag, RecipeType } from "../../interfaces/IRecipe";
import { ingredientTags, recipeTags, recipeTypes } from "../recipeBrowser/formOptions";
import type { SupplementaryFilter } from "./plannerRecipePickerTypes";

export const mainRecipeTypes: RecipeType[] = recipeTypes.filter((recipeType) => recipeType === "Dish");

export const supplementaryRecipeTypeFilters: RecipeType[] = recipeTypes.filter(
  (recipeType) =>
    recipeType === "Side" ||
    recipeType === "Sauce" ||
    recipeType === "Dip" ||
    recipeType === "SpiceMix",
);

export const supplementaryRecipeTagFilters: RecipeTag[] = recipeTags.filter(
  (recipeTag) => recipeTag === "Salad",
);

export const supplementaryFilters: SupplementaryFilter[] = [
  ...supplementaryRecipeTypeFilters,
  ...supplementaryRecipeTagFilters,
];

export const excludedSupplementaryTags: RecipeTag[] = recipeTags.filter(
  (recipeTag) => recipeTag === "Breakfast" || recipeTag === "Dinner",
);

export const mainProteinFilters: IngredientTag[] = ingredientTags.filter(
  (ingredientTag) =>
    ingredientTag === "Chicken" ||
    ingredientTag === "Fish" ||
    ingredientTag === "Beef" ||
    ingredientTag === "Lamb" ||
    ingredientTag === "Mince",
);

export const maxSupplementaryRecipes = 6;

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
  return mainRecipeTypes.includes(recipe.recipeType);
}

export function isSupplementaryRecipe(recipe: IRecipe, selectedFilters: SupplementaryFilter[]) {
  const matchesRecipeType =
    supplementaryRecipeTypeFilters.includes(recipe.recipeType) &&
    selectedFilters.includes(recipe.recipeType);
  const matchesRecipeTag = supplementaryRecipeTagFilters.some(
    (recipeTag) => selectedFilters.includes(recipeTag) && recipe.tags.includes(recipeTag),
  );

  return (
    (matchesRecipeType || matchesRecipeTag) &&
    !excludedSupplementaryTags.some((tag) => recipe.tags.includes(tag))
  );
}

export function matchesSelectedCuisines(recipe: IRecipe, selectedCuisineIds: number[]) {
  if (selectedCuisineIds.length === 0) {
    return true;
  }

  return recipe.cuisineId !== null && selectedCuisineIds.includes(recipe.cuisineId);
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
    recipe.recipeType,
    recipe.cuisine?.name,
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
    ...ingredient.tags.map(normalizeIngredientTag),
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
      .map(normalizeIngredientTag)
      .includes(ingredientTag),
  );
}

export function normalizeIngredientTag(tag: IngredientTag | number | string): IngredientTag {
  if (typeof tag === "string" && ingredientTagByIndex.includes(tag as IngredientTag)) {
    return tag as IngredientTag;
  }

  if (typeof tag === "number" && ingredientTagByIndex[tag]) {
    return ingredientTagByIndex[tag];
  }

  return "Other";
}

export function getSupplementaryRole(recipe: IRecipe): MealRecipeRole {
  if (recipe.recipeType === "Sauce" || recipe.recipeType === "Dip") {
    return "Sauce";
  }

  if (recipe.recipeType === "Side" || recipe.tags.includes("Salad")) {
    return "Side";
  }

  return "Extra";
}

const ingredientTagByIndex: IngredientTag[] = [
  "Vegetable",
  "Fruit",
  "Chicken",
  "Fish",
  "Beef",
  "Lamb",
  "Mince",
  "Dairy",
  "Grain",
  "Spice",
  "Herb",
  "Sauce",
  "Pantry",
  "Frozen",
  "Other",
  "LeafyGreen",
];

import type { IIngredient, IngredientTag } from "../../interfaces/IIngredient";
import type { RecipeTag, RecipeType } from "../../interfaces/IRecipe";
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
    recipe.recipeType,
    recipe.cuisine?.name,
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

export function matchesRecipeTypes(recipe: EnrichedRecipe, selectedRecipeTypes: RecipeType[]) {
  if (selectedRecipeTypes.length === 0) {
    return true;
  }

  return selectedRecipeTypes.includes(recipe.recipeType);
}

export function matchesRecipeTags(recipe: EnrichedRecipe, selectedRecipeTags: RecipeTag[]) {
  if (selectedRecipeTags.length === 0) {
    return true;
  }

  return recipe.tags.some((tag) => selectedRecipeTags.includes(tag));
}

export function matchesCuisines(recipe: EnrichedRecipe, selectedCuisineIds: number[]) {
  if (selectedCuisineIds.length === 0) {
    return true;
  }

  return recipe.cuisineId !== null && selectedCuisineIds.includes(recipe.cuisineId);
}

export function matchesIngredientTags(
  ingredient: IIngredient,
  selectedIngredientTags: IngredientTag[],
) {
  if (selectedIngredientTags.length === 0) {
    return true;
  }

  return ingredient.tags.some((tag) => selectedIngredientTags.includes(normalizeIngredientTag(tag)));
}

function normalizeIngredientTag(tag: IngredientTag | number | string): IngredientTag {
  if (typeof tag === "string" && ingredientTagByIndex.includes(tag as IngredientTag)) {
    return tag as IngredientTag;
  }

  if (typeof tag === "number" && ingredientTagByIndex[tag]) {
    return ingredientTagByIndex[tag];
  }

  return "Pantry";
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
  "LeafyGreen",
  "Berry",
  "RootVegetable",
  "Bread",
  "Dip",
];

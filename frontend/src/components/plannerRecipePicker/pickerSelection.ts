// The picker's selection: what is chosen for the slot, how it shows, and the items saved for the meal.


import type { Dispatch, SetStateAction } from "react";
import type { IIngredient, MeasurementUnit } from "../../interfaces/IIngredient";
import type { IIngredientTagCategory } from "../../interfaces/ILookup";
import type { IMealPlanEntry, MealRecipeRole, MealSlot } from "../../interfaces/IMeal";
import type { MealPlanRecipeRequest } from "../../services/mealPlanService";
import type { IRecipe, RecipeTag } from "../../interfaces/IRecipe";
import type { PlannerPickerSelectedItem } from "./PlannerRecipePickerSelection";

export type SelectedPlannerRecipe = {
  recipeId: number;
  portions: number;
};

export type SelectedPlannerIngredient = {
  ingredientId: number;
  amount: number;
  unit: MeasurementUnit;
};

export type PickerBrowserMode = "recipes" | "ingredients";

export function toSelectedRecipeItem(recipe: IRecipe, selection: SelectedPlannerRecipe): PlannerPickerSelectedItem {
  return {
    id: recipe.recipeId,
    imageUrl: recipe.imageUrl,
    thumbnailUrl: recipe.thumbnailUrl,
    kind: "recipe",
    name: recipe.name,
    valueLabel: `${formatNumber(selection.portions)}x`,
  };
}

export function toSelectedIngredientItem(
  ingredient: IIngredient,
  selection: SelectedPlannerIngredient,
  unitLabels: Record<MeasurementUnit, string>,
): PlannerPickerSelectedItem {
  return {
    id: ingredient.ingredientId,
    imageUrl: ingredient.imageUrl,
    thumbnailUrl: ingredient.thumbnailUrl,
    kind: "ingredient",
    name: ingredient.ingredientName,
    valueLabel: `${formatNumber(selection.amount)} ${unitLabels[selection.unit]}`,
  };
}

export function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function recipeByIdFallback(recipes: IRecipe[], recipeId: number | null) {
  return recipeId === null ? undefined : recipes.find((recipe) => recipe.recipeId === recipeId);
}

export function getInitialRecipeTagFilters(slot: MealSlot): RecipeTag[] {
  if (slot === "Breakfast") {
    return ["Breakfast"];
  }

  if (slot === "Lunch") {
    return ["Lunch", "Dinner"];
  }

  return slot === "Dinner" ? ["Dinner"] : [];
}

export function buildAvailableTagNames(
  categories: IIngredientTagCategory[],
  recipes: IRecipe[],
  ingredients: IIngredient[],
) {
  const tagNames = new Set<string>();

  for (const category of categories) {
    for (const tag of category.tags) {
      tagNames.add(tag.name);
    }
  }

  for (const recipe of recipes) {
    for (const tag of recipe.tags) {
      tagNames.add(tag);
    }
  }

  for (const ingredient of ingredients) {
    for (const tag of ingredient.tags) {
      tagNames.add(tag);
    }
  }

  return tagNames;
}

export function findAvailableTagName(tagNames: ReadonlySet<string>, candidates: string[]) {
  return candidates.find((candidate) => tagNames.has(candidate));
}

export function uniqueValues<TValue>(values: Array<TValue | undefined>) {
  return Array.from(new Set(values.filter((value): value is TValue => value !== undefined)));
}

export function toggleTagFilter<TTag extends string>(
  tag: TTag,
  setTags: Dispatch<SetStateAction<TTag[]>>,
) {
  setTags((currentTags) =>
    currentTags.includes(tag)
      ? currentTags.filter((currentTag) => currentTag !== tag)
      : [...currentTags, tag],
  );
}

/**
 * The items of the planned meal, in order: the main recipe or ingredient, then the other recipes (Side, Sauce or
 * Extra by their tags) and the other ingredients (Side).
 */
export function toMealPlanItems({
  mainRecipe,
  mainIngredient,
  supplementaryRecipes,
  supplementaryIngredients,
  roleOf,
}: {
  mainRecipe: SelectedPlannerRecipe | null;
  mainIngredient: SelectedPlannerIngredient | null;
  supplementaryRecipes: SelectedPlannerRecipe[];
  supplementaryIngredients: SelectedPlannerIngredient[];
  roleOf: (recipeId: number) => MealRecipeRole;
}): MealPlanRecipeRequest[] {
  return [
    ...(mainRecipe === null
      ? []
      : [{
          recipeId: mainRecipe.recipeId,
          ingredientId: null,
          role: "Main" as const,
          sortOrder: 0,
          portions: mainRecipe.portions,
          amount: null,
          unit: null,
        }]),
    ...(mainIngredient === null
      ? []
      : [{
          recipeId: null,
          ingredientId: mainIngredient.ingredientId,
          role: "Main" as const,
          sortOrder: 0,
          portions: null,
          amount: mainIngredient.amount,
          unit: mainIngredient.unit,
        }]),
    ...supplementaryRecipes.map((selection, index) => ({
      recipeId: selection.recipeId,
      ingredientId: null,
      role: roleOf(selection.recipeId),
      sortOrder: index + 1,
      portions: selection.portions,
      amount: null,
      unit: null,
    })),
    ...supplementaryIngredients.map((selection, index) => ({
      recipeId: null,
      ingredientId: selection.ingredientId,
      role: "Side" as const,
      sortOrder: supplementaryRecipes.length + index + 1,
      portions: null,
      amount: selection.amount,
      unit: selection.unit,
    })),
  ];
}

/** What an existing meal starts the picker with: its main recipe or ingredient and the rest. */
export function getInitialSelections(entry: IMealPlanEntry | undefined, recipes: IRecipe[]) {
  const sortedItems = entry?.recipes.slice().sort((first, second) => first.sortOrder - second.sortOrder) ?? [];
  const mainItem = sortedItems.find((plannedRecipe) => plannedRecipe.role === "Main") ?? sortedItems[0];
  const supplementaryItems = sortedItems.filter((plannedRecipe) => plannedRecipe !== mainItem);
  const mainRecipe = mainItem?.recipeId !== null && mainItem?.recipeId !== undefined ? mainItem : undefined;
  const mainIngredient = mainItem?.ingredientId !== null && mainItem?.ingredientId !== undefined ? mainItem : undefined;

  return {
    mainRecipe: mainRecipe === undefined ? null : {
      recipeId: mainRecipe.recipeId!,
      portions: mainRecipe.portions ?? recipeByIdFallback(recipes, mainRecipe.recipeId)?.portions ?? 1,
    } satisfies SelectedPlannerRecipe,
    mainIngredient: mainIngredient === undefined ? null : {
      ingredientId: mainIngredient.ingredientId!,
      amount: mainIngredient.amount ?? 1,
      unit: mainIngredient.unit ?? ("Gram" as MeasurementUnit),
    } satisfies SelectedPlannerIngredient,
    supplementaryRecipes: supplementaryItems
      .filter((plannedRecipe) => plannedRecipe.recipeId !== null)
      .map((plannedRecipe): SelectedPlannerRecipe => ({
        recipeId: plannedRecipe.recipeId!,
        portions: plannedRecipe.portions ?? recipeByIdFallback(recipes, plannedRecipe.recipeId)?.portions ?? 1,
      })),
    supplementaryIngredients: supplementaryItems
      .filter((plannedRecipe) => plannedRecipe.ingredientId !== null)
      .map((plannedRecipe): SelectedPlannerIngredient => ({
        ingredientId: plannedRecipe.ingredientId!,
        amount: plannedRecipe.amount ?? 1,
        unit: plannedRecipe.unit ?? ("Gram" as MeasurementUnit),
      })),
  };
}

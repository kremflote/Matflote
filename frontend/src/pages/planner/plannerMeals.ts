// The planner page's meal arithmetic and request building: moving and scaling meals, labels, and the generator's
// settings and messages.


import { useLanguage } from "../../contexts";
import type { IGroceryList } from "../../interfaces/IGroceryList";
import type { MeasurementUnit } from "../../interfaces/IIngredient";
import type { IMealPlanEntry, IMealPlanRecipe, MealSlot } from "../../interfaces/IMeal";
import { appSettingsService } from "../../services";
import type { MealPlanEntryRequest, MealPlanRecipeRequest } from "../../services/mealPlanService";
import { defaultDinnerMinimums, type DinnerMinimums, type MealPlanGenerationIssue } from "../../utils/plannerGenerator";

export const defaultPeopleEating = 2;

export type SelectedPlannerSlot = {
  date: string;
  slot: MealSlot;
};

export type PendingMealMove = {
  amountKind: "amount" | "none" | "portions";
  label: string;
  maxValue: number;
  source: SelectedPlannerSlot;
  sourceEntry: IMealPlanEntry;
  target: SelectedPlannerSlot;
  unit: MeasurementUnit | null;
  value: number;
};

export function getMealPlanEntryKey(date: string, slot: MealSlot) {
  return `${date}::${slot}`;
}

export function getMainMealItem(entry: IMealPlanEntry) {
  const sortedItems = entry.recipes.slice().sort((first, second) => first.sortOrder - second.sortOrder);

  return sortedItems.find((plannedRecipe) => plannedRecipe.role === "Main") ?? sortedItems[0];
}

export function getMealEntryLabel(
  entry: IMealPlanEntry,
  recipesById: ReadonlyMap<number, { name: string }>,
  ingredientsById: ReadonlyMap<number, { ingredientName: string }>,
  t: ReturnType<typeof useLanguage>["t"],
) {
  const mainItem = getMainMealItem(entry);
  const recipe = mainItem?.recipeId === null || mainItem === undefined ? undefined : recipesById.get(mainItem.recipeId);
  const ingredient = mainItem?.ingredientId === null || mainItem === undefined ? undefined : ingredientsById.get(mainItem.ingredientId);

  return recipe?.name ?? ingredient?.ingredientName ?? t.planner.recipeFallback(mainItem?.recipeId ?? mainItem?.ingredientId ?? 0);
}

export function createPendingMealMove({
  label,
  source,
  sourceEntry,
  target,
}: {
  label: string;
  source: SelectedPlannerSlot;
  sourceEntry: IMealPlanEntry;
  target: SelectedPlannerSlot;
}): PendingMealMove {
  const mainItem = getMainMealItem(sourceEntry);

  if (mainItem?.recipeId !== null && mainItem?.recipeId !== undefined && mainItem.portions !== null && mainItem.portions > 0) {
    return {
      amountKind: "portions",
      label,
      maxValue: mainItem.portions,
      source,
      sourceEntry,
      target,
      unit: null,
      value: mainItem.portions,
    };
  }

  if (mainItem?.ingredientId !== null && mainItem?.ingredientId !== undefined && mainItem.amount !== null && mainItem.amount > 0) {
    return {
      amountKind: "amount",
      label,
      maxValue: mainItem.amount,
      source,
      sourceEntry,
      target,
      unit: mainItem.unit,
      value: mainItem.amount,
    };
  }

  return {
    amountKind: "none",
    label,
    maxValue: 1,
    source,
    sourceEntry,
    target,
    unit: null,
    value: 1,
  };
}

export function toMealPlanRequest(entry: IMealPlanEntry, date: string, slot: MealSlot): MealPlanEntryRequest {
  return {
    date,
    slot,
    notes: entry.notes,
    recipes: toMealPlanRecipeRequests(entry.recipes),
  };
}

export function toMealPlanRecipeRequests(recipes: IMealPlanRecipe[]): MealPlanRecipeRequest[] {
  return recipes
    .slice()
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .map((recipe, index) => ({
      recipeId: recipe.recipeId,
      ingredientId: recipe.ingredientId,
      role: index === 0 ? "Main" : recipe.role,
      sortOrder: index,
      portions: recipe.portions,
      amount: recipe.amount,
      unit: recipe.unit,
    }));
}

export function scaleMealPlanRecipes(recipes: IMealPlanRecipe[], ratio: number): MealPlanRecipeRequest[] {
  if (ratio <= 0) {
    return [];
  }

  return recipes
    .slice()
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .map((recipe, index) => ({
      recipeId: recipe.recipeId,
      ingredientId: recipe.ingredientId,
      role: index === 0 ? "Main" : recipe.role,
      sortOrder: index,
      portions: recipe.portions === null ? null : roundPlannerQuantity(recipe.portions * ratio),
      amount: recipe.amount === null ? null : roundPlannerQuantity(recipe.amount * ratio),
      unit: recipe.unit,
    }))
    .filter((recipe) => recipe.portions === null || recipe.portions > 0)
    .filter((recipe) => recipe.amount === null || recipe.amount > 0);
}

export function roundPlannerQuantity(value: number) {
  return Math.round(value * 10) / 10;
}

export function normalizeMoveValue(value: number, maxValue: number) {
  if (!Number.isFinite(value)) {
    return maxValue;
  }

  return Math.max(1, Math.min(maxValue, Math.round(value)));
}

export function createEmptyGroceryList(from: string, to: string): IGroceryList {
  return {
    from,
    to,
    generatedAt: new Date().toISOString(),
    sections: [],
  };
}

export function normalizePeopleEating(value: number) {
  if (!Number.isFinite(value)) {
    return defaultPeopleEating;
  }

  return Math.max(1, Math.min(24, Math.round(value)));
}

export function getPlannerActionError(_error: unknown, fallbackMessage: string) {
  return fallbackMessage;
}

export function formatGenerationIssues(
  issues: MealPlanGenerationIssue[],
  t: ReturnType<typeof useLanguage>["t"],
) {
  if (issues.length === 0) {
    return null;
  }

  return issues
    .map((issue) => {
      switch (issue.code) {
        case "MissingSystemTag":
          return t.planner.generationIssues.missingSystemTag(t.enums.mealSlots[issue.slot]);
        case "NoTaggedRecipes":
          return t.planner.generationIssues.noTaggedRecipes(t.enums.mealSlots[issue.slot], issue.tagName);
        case "NoRecipeWithEnoughPortions":
          return t.planner.generationIssues.noRecipeWithEnoughPortions(
            t.enums.mealSlots[issue.slot],
            issue.tagName,
            issue.peopleEating,
          );
        case "NoAvailableDinnerRecipes":
          return t.planner.generationIssues.noAvailableDinnerRecipes;
        case "NoEmptySlots":
          return t.planner.generationIssues.noEmptySlots;
        case "NoToppingIngredients":
          return t.planner.generationIssues.noToppingIngredients(issue.tagName);
      }
    })
    .join(" ");
}

/** The fish and chicken minimums from Settings, read when generating so the planner page does not load them on every visit. */
export async function loadDinnerMinimums(): Promise<DinnerMinimums> {
  try {
    const preferences = await appSettingsService.getPlanningPreferences();
    return { fish: preferences.minFishDinnersPerWeek, chicken: preferences.minChickenDinnersPerWeek };
  } catch (_error) {
    return defaultDinnerMinimums;
  }
}

import { describe, expect, it } from "vitest";
import type { IMealPlanEntry } from "../../interfaces/IMeal";
import type { IRecipe } from "../../interfaces/IRecipe";
import { getInitialSelections, toMealPlanItems } from "./pickerSelection";

const recipes = [{ recipeId: 1, portions: 4 }, { recipeId: 2, portions: 2 }] as IRecipe[];
const item = (values: Partial<IMealPlanEntry["recipes"][number]>) => ({
  mealPlanRecipeId: 0, recipeId: null, ingredientId: null, role: "Side", sortOrder: 0, portions: null, amount: null, unit: null, ...values,
}) as IMealPlanEntry["recipes"][number];

describe("the picker selection", () => {
  it("starts from an existing meal: the main item and the rest", () => {
    const entry = {
      mealPlanEntryId: 5, date: "2026-11-30", slot: "Dinner", notes: null,
      recipes: [
        item({ ingredientId: 7, role: "Side", sortOrder: 2, amount: 100, unit: "Gram" }),
        item({ recipeId: 2, role: "Side", sortOrder: 1 }),
        item({ recipeId: 1, role: "Main", sortOrder: 0, portions: 3 }),
      ],
    } as IMealPlanEntry;

    expect(getInitialSelections(entry, recipes)).toEqual({
      mainRecipe: { recipeId: 1, portions: 3 },
      mainIngredient: null,
      supplementaryRecipes: [{ recipeId: 2, portions: 2 }],
      supplementaryIngredients: [{ ingredientId: 7, amount: 100, unit: "Gram" }],
    });
    expect(getInitialSelections(undefined, recipes)).toEqual({
      mainRecipe: null, mainIngredient: null, supplementaryRecipes: [], supplementaryIngredients: [],
    });
  });

  it("saves the main item first, then the other recipes with their roles, then the other ingredients", () => {
    expect(toMealPlanItems({
      mainRecipe: { recipeId: 1, portions: 3 },
      mainIngredient: null,
      supplementaryRecipes: [{ recipeId: 2, portions: 2 }],
      supplementaryIngredients: [{ ingredientId: 7, amount: 100, unit: "Gram" }],
      roleOf: () => "Sauce",
    })).toEqual([
      { recipeId: 1, ingredientId: null, role: "Main", sortOrder: 0, portions: 3, amount: null, unit: null },
      { recipeId: 2, ingredientId: null, role: "Sauce", sortOrder: 1, portions: 2, amount: null, unit: null },
      { recipeId: null, ingredientId: 7, role: "Side", sortOrder: 2, portions: null, amount: 100, unit: "Gram" },
    ]);
  });
});

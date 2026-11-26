import { describe, expect, it } from "vitest";
import type { IRecipe } from "../../interfaces/IRecipe";
import { getSupplementaryRole, matchesSelectedRecipeTags } from "./plannerRecipePickerFilters";

const recipe = (tags: string[]) => ({ recipeId: 1, name: "Recipe", tags }) as unknown as IRecipe;

describe("matchesSelectedRecipeTags (F4)", () => {
  it("shows a lunch-only recipe when the lunch slot preselects Lunch and Dinner", () => {
    expect(matchesSelectedRecipeTags(recipe(["Lunch"]), ["Lunch", "Dinner"])).toBe(true);
    expect(matchesSelectedRecipeTags(recipe(["Dinner"]), ["Lunch", "Dinner"])).toBe(true);
  });

  it("still hides a recipe without any of the selected meal-time tags", () => {
    expect(matchesSelectedRecipeTags(recipe(["Breakfast"]), ["Lunch", "Dinner"])).toBe(false);
    expect(matchesSelectedRecipeTags(recipe([]), ["Dinner"])).toBe(false);
  });

  it("requires every other selected tag", () => {
    expect(matchesSelectedRecipeTags(recipe(["Lunch", "Chicken"]), ["Lunch", "Dinner", "Chicken"])).toBe(true);
    expect(matchesSelectedRecipeTags(recipe(["Lunch"]), ["Lunch", "Dinner", "Chicken"])).toBe(false);
    expect(matchesSelectedRecipeTags(recipe(["Chicken"]), ["Chicken", "Fish"])).toBe(false);
  });

  it("matches everything when nothing is selected", () => {
    expect(matchesSelectedRecipeTags(recipe([]), [])).toBe(true);
  });
});

describe("getSupplementaryRole (F15)", () => {
  it("uses the default tag names when no tag carries the key", () => {
    const none = new Map<string, string>();
    expect(getSupplementaryRole(recipe(["Dip"]), none)).toBe("Sauce");
    expect(getSupplementaryRole(recipe(["Salad"]), none)).toBe("Side");
    expect(getSupplementaryRole(recipe(["Dessert"]), none)).toBe("Extra");
  });

  it("follows a renamed tag by its system key", () => {
    const renamed = new Map([
      ["FoodRole.Sauce", "Saus"],
      ["FoodRole.Side", "Tilbehør"],
    ]);
    expect(getSupplementaryRole(recipe(["Saus"]), renamed)).toBe("Sauce");
    expect(getSupplementaryRole(recipe(["Tilbehør"]), renamed)).toBe("Side");
    // The old English name no longer means anything once the tag is renamed.
    expect(getSupplementaryRole(recipe(["Sauce"]), renamed)).toBe("Extra");
  });
});

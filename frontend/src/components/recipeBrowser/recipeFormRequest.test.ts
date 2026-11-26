import { describe, expect, it } from "vitest";
import { en } from "../../i18n/en";
import { buildRecipeRequest, checkRecipeForm, type RecipeFormValues } from "./recipeFormRequest";

const values: RecipeFormValues = {
  name: "  Fish soup ",
  portions: "2,5",
  description: " ",
  instructions: "Simmer.",
  selectedIngredients: [{ ingredientId: 4, amount: "300", unit: "Gram", preparation: "None" }],
  selectedComponents: [{ recipeId: 9, amount: "100", unit: "Milliliter", preparation: "None" }],
  selectedTags: ["Fish"],
};

describe("the recipe form request", () => {
  it("builds the request from the text fields", () => {
    expect(checkRecipeForm(values, en)).toBeNull();
    expect(buildRecipeRequest(values, "/images/recipes/a.jpg")).toEqual({
      name: "Fish soup",
      imageUrl: "/images/recipes/a.jpg",
      description: null,
      instructions: "Simmer.",
      portions: 2.5,
      ingredients: [{ ingredientId: 4, amount: 300, unit: "Gram", preparation: "None" }],
      tags: ["Fish"],
      components: [{ recipeId: 9, amount: 100, unit: "Milliliter", preparation: "None", sortOrder: 1 }],
    });
  });

  it.each([
    [{ name: " " }, en.cookbook.recipeNeedsName],
    [{ name: "x".repeat(31) }, en.cookbook.recipeNameTooLong(30)],
    [{ selectedIngredients: [], selectedComponents: [] }, en.cookbook.chooseAtLeastOneIngredient],
    [{ portions: "0" }, en.cookbook.portionsRequired],
    [{ selectedComponents: [{ recipeId: 9, amount: "", unit: "Gram", preparation: "None" }] }, en.cookbook.recipeComponentAmountRequired],
  ] as const)("refuses %j", (change, message) => {
    expect(checkRecipeForm({ ...values, ...change } as RecipeFormValues, en)).toBe(message);
  });
});

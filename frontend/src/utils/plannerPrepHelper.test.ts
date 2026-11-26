import { describe, expect, it } from "vitest";
import type { IIngredient, MeasurementUnit } from "../interfaces/IIngredient";
import type { IMealPlanEntry } from "../interfaces/IMeal";
import type { IngredientPreparation, IRecipe, IRecipeComponent } from "../interfaces/IRecipe";
import { buildPrepHelperItems, getPrepIngredientTagNames } from "./plannerPrepHelper";

const preparationLabels: Record<IngredientPreparation, string> = {
  None: "",
  Quartered: "Quarter",
  Wedged: "Cut into wedges",
  Chopped: "Chop",
  RoughlyChopped: "Roughly chop",
  FinelyChopped: "Finely chop",
  Diced: "Dice",
  Cubed: "Cube",
  Julienned: "Julienne",
  Batons: "Cut into batons",
  Sliced: "Slice",
  Minced: "Mince",
  Grated: "Grate",
  Shredded: "Shred",
  Crushed: "Crush",
};

const actionLabels: Record<string, string> = {
  chop: "Chop",
  dice: "Dice",
  grate: "Grate",
  slice: "Slice",
  roughChop: "Roughly chop",
};

let nextId = 1;

function ingredient(name: string, ...tags: string[]): IIngredient {
  return {
    ingredientId: nextId++,
    ingredientName: name,
    description: null,
    brandId: null,
    brand: null,
    imageUrl: null,
    thumbnailUrl: null,
    tags,
    nutritionPer100: null,
    nutritionSource: "None",
    nutritionSourceLabel: null,
    matvaretabellenFoodId: null,
    nutritionMatchedName: null,
    nutritionMatchConfidence: null,
    color: null,
  };
}

type Line = [IIngredient, number | null, MeasurementUnit?, IngredientPreparation?];

function recipe(
  name: string,
  portions: number,
  lines: Line[],
  options: { instructions?: string; components?: IRecipeComponent[] } = {},
): IRecipe {
  return {
    recipeId: nextId++,
    name,
    imageUrl: null,
    thumbnailUrl: null,
    description: null,
    instructions: options.instructions ?? null,
    portions,
    ingredients: lines.map(([item, amount, unit = "Gram", preparation = "None"]) => ({
      recipeIngredientId: nextId++,
      ingredient: item,
      amount,
      unit,
      preparation,
    })),
    tags: [],
    components: options.components ?? [],
    rating: null,
    ratingNote: null,
  };
}

function component(child: IRecipe, amount: number, unit: MeasurementUnit = "Gram"): IRecipeComponent {
  return { recipeId: child.recipeId, name: child.name, amount, unit, preparation: "None", sortOrder: 1 };
}

function meal(date: string, ...items: Array<[IRecipe, number | null]>): IMealPlanEntry {
  return {
    mealPlanEntryId: nextId++,
    date,
    slot: "Dinner",
    notes: null,
    recipes: items.map(([item, portions], index) => ({
      mealPlanRecipeId: nextId++,
      recipeId: item.recipeId,
      ingredientId: null,
      role: index === 0 ? "Main" : "Side",
      sortOrder: index,
      portions,
      amount: null,
      unit: null,
    })),
  };
}

function build(entries: IMealPlanEntry[], recipes: IRecipe[], from = "2026-11-23", to = "2026-11-29") {
  return buildPrepHelperItems(
    entries,
    new Map(recipes.map((item) => [item.recipeId, item])),
    from,
    to,
    preparationLabels,
    actionLabels,
  );
}

describe("buildPrepHelperItems", () => {
  const onion = ingredient("Onion", "Vegetable");

  it("finds produce by system key after the tag was renamed (F15)", () => {
    const leek = ingredient("Leek", "Grønnsak");
    const soup = recipe("Soup", 2, [[leek, 200, "Gram", "Sliced"]]);
    const renamed = new Map([["Produce.Vegetable", "Grønnsak"]]);

    const items = buildPrepHelperItems(
      [meal("2026-11-24", [soup, 2])],
      new Map([[soup.recipeId, soup]]),
      "2026-11-23",
      "2026-11-29",
      preparationLabels,
      actionLabels,
      getPrepIngredientTagNames(renamed),
    );

    expect(items.map((item) => item.ingredientName)).toEqual(["Leek"]);
    expect(getPrepIngredientTagNames(renamed)).toEqual(["Grønnsak", "Fruit", "Herb", "LeafyGreen"]);
  });

  const carrot = ingredient("Carrot", "RootVegetable", "Vegetable");
  const parsley = ingredient("Parsley", "Herb");
  const lemon = ingredient("Lemon", "Fruit");
  const rice = ingredient("Rice", "Grain");
  const chicken = ingredient("Chicken", "Chicken");

  it("lists produce with its preparation, scaled to the planned portions", () => {
    const stew = recipe("Stew", 4, [
      [onion, 200, "Gram", "Diced"],
      [rice, 300, "Gram", "Chopped"],
      [chicken, 400, "Gram", "Cubed"],
    ]);

    const items = build([meal("2026-11-24", [stew, 2])], [stew]);

    // Only produce is listed; rice and chicken are not prepped here even with a preparation.
    expect(items).toEqual([
      { ingredientId: onion.ingredientId, ingredientName: "Onion", amount: 100, unit: "Gram", actions: ["Dice"], sources: ["Stew"] },
    ]);
  });

  it("uses the recipe's own portions when the meal has none", () => {
    const stew = recipe("Stew", 4, [[onion, 200, "Gram", "Diced"]]);
    expect(build([meal("2026-11-24", [stew, null])], [stew])[0].amount).toBe(200);
  });

  it("ignores meals outside the range and ingredient-only items", () => {
    const stew = recipe("Stew", 2, [[onion, 100, "Gram", "Sliced"]]);
    const ingredientOnly: IMealPlanEntry = {
      mealPlanEntryId: nextId++,
      date: "2026-11-25",
      slot: "Snack1",
      notes: null,
      recipes: [{ mealPlanRecipeId: nextId++, recipeId: null, ingredientId: lemon.ingredientId, role: "Main", sortOrder: 0, portions: null, amount: 100, unit: "Gram" }],
    };

    const items = build(
      [meal("2026-11-22", [stew, 2]), meal("2026-11-30", [stew, 2]), ingredientOnly, meal("2026-11-29", [stew, 2])],
      [stew],
    );

    expect(items).toHaveLength(1);
    expect(items[0].amount).toBe(100);
  });

  it("adds up the same ingredient and preparation across meals and names every source", () => {
    const soup = recipe("Soup", 2, [[carrot, 100, "Gram", "Sliced"]]);
    const salad = recipe("Salad", 2, [[carrot, 50, "Gram", "Sliced"], [carrot, 999, "Kilogram", "Sliced"]]);

    const items = build([meal("2026-11-23", [soup, 4]), meal("2026-11-24", [salad, 2])], [soup, salad]);

    const grams = items.find((item) => item.unit === "Gram");
    expect(grams).toMatchObject({ amount: 250, actions: ["Slice"], sources: ["Salad", "Soup"] });
    // A different unit is kept as its own line.
    expect(items.find((item) => item.unit === "Kilogram")?.amount).toBe(999);
  });

  it("keeps different preparations of one ingredient apart", () => {
    const soup = recipe("Soup", 2, [[onion, 100, "Gram", "Diced"]]);
    const salad = recipe("Salad", 2, [[onion, 50, "Gram", "Sliced"]]);

    const items = build([meal("2026-11-23", [soup, 2], [salad, 2])], [soup, salad]);

    expect(items.map((item) => item.actions)).toEqual([["Dice"], ["Slice"]]);
  });

  it("treats an unknown amount as unknown in the total", () => {
    const soup = recipe("Soup", 2, [[parsley, null, "Gram", "Chopped"]]);
    const salad = recipe("Salad", 2, [[parsley, 10, "Gram", "Chopped"]]);

    const items = build([meal("2026-11-23", [soup, 2], [salad, 2])], [soup, salad]);

    expect(items).toHaveLength(1);
    expect(items[0].amount).toBeNull();
  });

  it("reads the action from the instructions when no preparation is set", () => {
    const tagine = recipe("Tagine", 2, [[onion, 100], [carrot, 80], [lemon, 50], [parsley, 5]], {
      instructions: "Dice the onion. Grate the carrot and zest the lemon.\nServe.",
    });

    const items = build([meal("2026-11-23", [tagine, 2])], [tagine]);

    expect(items.map((item) => [item.ingredientName, item.actions])).toEqual([
      ["Carrot", ["Grate"]],
      // The lemon is mentioned in the same sentence as "grate".
      ["Lemon", ["Grate"]],
      ["Onion", ["Dice"]],
      // Parsley is not named in any sentence, so every action in the instructions applies to it.
      ["Parsley", ["Dice", "Grate"]],
    ]);
  });

  it("recognises Norwegian instructions", () => {
    const suppe = recipe("Suppe", 2, [[onion, 100]], { instructions: "Hakk løken (onion) fint." });
    expect(build([meal("2026-11-23", [suppe, 2])], [suppe])[0].actions).toEqual(["Chop"]);
  });

  it("falls back to the whole instructions when no sentence names the ingredient", () => {
    const salad = recipe("Salad", 2, [[lemon, 50]], { instructions: "Slice everything thinly." });
    expect(build([meal("2026-11-23", [salad, 2])], [salad])[0].actions).toEqual(["Slice"]);
  });

  it("leaves out produce that needs no preparation", () => {
    const salad = recipe("Salad", 2, [[lemon, 50]], { instructions: "Mix and serve." });
    expect(build([meal("2026-11-23", [salad, 2])], [salad])).toEqual([]);
  });

  it("includes component recipes scaled by the share used", () => {
    // The salsa makes 400 g; the tacos use 100 g of it (a quarter) and serve 4.
    const salsa = recipe("Salsa", 1, [[onion, 100, "Gram", "Diced"], [lemon, 300, "Gram", "Quartered"]]);
    const tacos = recipe("Tacos", 4, [[onion, 40, "Gram", "Sliced"]], { components: [component(salsa, 100)] });

    const items = build([meal("2026-11-23", [tacos, 8])], [tacos, salsa]);

    // Factor 2 for portions, times a quarter of the salsa.
    expect(items).toEqual([
      { ingredientId: lemon.ingredientId, ingredientName: "Lemon", amount: 150, unit: "Gram", actions: ["Quarter"], sources: ["Salsa via Tacos"] },
      { ingredientId: onion.ingredientId, ingredientName: "Onion", amount: 80, unit: "Gram", actions: ["Slice"], sources: ["Tacos"] },
      { ingredientId: onion.ingredientId, ingredientName: "Onion", amount: 50, unit: "Gram", actions: ["Dice"], sources: ["Salsa via Tacos"] },
    ]);
  });

  it("stops at a component cycle instead of looping", () => {
    const first = recipe("First", 1, [[onion, 100, "Gram", "Diced"]]);
    const second = recipe("Second", 1, [[onion, 100, "Gram", "Diced"]], { components: [component(first, 100)] });
    first.components = [component(second, 100)];

    const items = build([meal("2026-11-23", [first, 1])], [first, second]);

    expect(items).toHaveLength(1);
    expect(items[0].sources).toEqual(["First", "Second via First"]);
  });
});

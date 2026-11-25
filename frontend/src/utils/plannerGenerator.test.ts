import { describe, expect, it } from "vitest";
import type { IIngredient } from "../interfaces/IIngredient";
import type { IIngredientTagCategory } from "../interfaces/ILookup";
import type { IMealPlanEntry, MealSlot } from "../interfaces/IMeal";
import type { IRecipe } from "../interfaces/IRecipe";
import type { MealPlanEntryRequest } from "../services/mealPlanService";
import { getGenerationDates } from "./plannerDate";
import {
  generateMealPlanEntries,
  generateMealPlanEntriesWithIssues,
  type RandomSource,
} from "./plannerGenerator";

/** Small deterministic generator (mulberry32) so a test run can be repeated exactly. */
function seeded(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

// The household calls its tags by local names; the generator must find them through their system keys.
const systemTagNames: Record<string, string> = {
  "Meal.Breakfast": "Frokost",
  "Meal.Lunch": "Lunsj",
  "Meal.Dinner": "Middag",
  "Protein.Fish": "Fisk",
  "Protein.Chicken": "Kylling",
  "Protein.Beef": "Storfe",
  "Protein.Lamb": "Lam",
  "Protein.Mince": "Kjøttdeig",
  "Format.Bread": "Brød",
  "FoodRole.Topping": "Pålegg",
};

function tagCategories(systemKeys = Object.keys(systemTagNames)): IIngredientTagCategory[] {
  return [
    {
      ingredientTagCategoryId: 1,
      name: "System",
      sortOrder: 1,
      showForIngredients: true,
      showForRecipes: true,
      tags: systemKeys.map((systemKey, index) => ({
        ingredientTagDefinitionId: index + 1,
        name: systemTagNames[systemKey],
        sortOrder: index,
        isSystemTag: true,
        systemKey,
      })),
    },
  ];
}

const tag = (systemKey: keyof typeof systemTagNames) => systemTagNames[systemKey];

let nextId = 1;

function recipe(name: string, portions: number, ...tags: string[]): IRecipe {
  return {
    recipeId: nextId++,
    name,
    imageUrl: null,
    thumbnailUrl: null,
    description: null,
    instructions: null,
    portions,
    ingredients: [],
    tags,
    components: [],
  };
}

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

function plannedEntry(date: string, slot: MealSlot, recipeId: number): IMealPlanEntry {
  return {
    mealPlanEntryId: nextId++,
    date,
    slot,
    notes: null,
    recipes: [
      { mealPlanRecipeId: nextId++, recipeId, ingredientId: null, role: "Main", sortOrder: 0, portions: 2, amount: null, unit: null },
    ],
  };
}

// Monday 23 to Sunday 29 November 2026.
const week = getGenerationDates(new Date(2026, 10, 25), "week");

const slotKey = (entry: MealPlanEntryRequest) => `${entry.date} ${entry.slot}`;
const mainRecipeId = (entry: MealPlanEntryRequest) => entry.recipes[0].recipeId;

const sample = {
  porridge: recipe("Porridge", 2, tag("Meal.Breakfast")),
  yogurt: recipe("Yogurt bowl", 2, tag("Meal.Breakfast")),
  soup: recipe("Soup", 2, tag("Meal.Lunch")),
  salad: recipe("Salad", 2, tag("Meal.Lunch")),
  salmon: recipe("Salmon", 2, tag("Meal.Dinner"), tag("Protein.Fish")),
  cod: recipe("Cod", 2, tag("Meal.Dinner"), tag("Protein.Fish")),
  chickenCurry: recipe("Chicken curry", 2, tag("Meal.Dinner"), tag("Protein.Chicken")),
  chickenWok: recipe("Chicken wok", 2, tag("Meal.Dinner"), tag("Protein.Chicken")),
  roastChicken: recipe("Roast chicken", 2, tag("Meal.Dinner"), tag("Protein.Chicken")),
  tacos: recipe("Tacos", 2, tag("Meal.Dinner"), tag("Protein.Mince")),
  lamb: recipe("Lamb stew", 2, tag("Meal.Dinner"), tag("Protein.Lamb")),
  steak: recipe("Steak", 2, tag("Meal.Dinner"), tag("Protein.Beef")),
  lentils: recipe("Lentils", 2, tag("Meal.Dinner")),
  pasta: recipe("Pasta", 2, tag("Meal.Dinner")),
};

function generate(overrides: Partial<Parameters<typeof generateMealPlanEntriesWithIssues>[0]> = {}) {
  return generateMealPlanEntriesWithIssues({
    dates: week,
    existingEntries: [],
    ingredients: [],
    peopleEating: 2,
    recipes: Object.values(sample),
    tagCategories: tagCategories(),
    random: seeded(1),
    ...overrides,
  });
}

describe("generateMealPlanEntriesWithIssues", () => {
  it("fills breakfast, lunch and dinner on every day of the range and nothing else", () => {
    const { entries, issues } = generate();

    expect(issues).toEqual([]);
    expect(entries).toHaveLength(21);
    expect(new Set(entries.map(slotKey)).size).toBe(21);
    expect(new Set(entries.map((entry) => entry.slot))).toEqual(new Set(["Breakfast", "Lunch", "Dinner"]));
    expect(new Set(entries.map((entry) => entry.date))).toEqual(
      new Set(["2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27", "2026-11-28", "2026-11-29"]),
    );
  });

  it("plans one main item per meal for the people eating", () => {
    const { entries } = generate({ peopleEating: 2 });

    for (const entry of entries) {
      expect(entry.notes).toBeNull();
      expect(entry.recipes[0]).toMatchObject({ role: "Main", sortOrder: 0, portions: 2, ingredientId: null });
    }
  });

  it("only uses recipes tagged for the slot", () => {
    const recipes = sample;
    const { entries } = generate();
    const byId = new Map(Object.values(recipes).map((item) => [item.recipeId, item]));
    const slotTag: Record<string, string> = {
      Breakfast: tag("Meal.Breakfast"),
      Lunch: tag("Meal.Lunch"),
      Dinner: tag("Meal.Dinner"),
    };

    for (const entry of entries) {
      expect(byId.get(mainRecipeId(entry)!)!.tags).toContain(slotTag[entry.slot]);
    }
  });

  it("is repeatable with the same seed and varies with another", () => {
    const first = generate({ random: seeded(42) }).entries;
    const again = generate({ random: seeded(42) }).entries;
    expect(again).toEqual(first);

    const others = [7, 8, 9, 10].map((seed) => generate({ random: seeded(seed) }).entries);
    expect(others.some((entries) => JSON.stringify(entries) !== JSON.stringify(first))).toBe(true);
  });

  it("meets the fish and chicken dinner minimums and does not repeat a dinner", () => {
    const recipes = sample;
    const fish = new Set([recipes.salmon.recipeId, recipes.cod.recipeId]);
    const chicken = new Set([recipes.chickenCurry.recipeId, recipes.chickenWok.recipeId, recipes.roastChicken.recipeId]);

    for (let seed = 1; seed <= 50; seed += 1) {
      const dinners = generate({ random: seeded(seed) }).entries
        .filter((entry) => entry.slot === "Dinner")
        .map((entry) => mainRecipeId(entry)!);

      expect(dinners).toHaveLength(7);
      expect(new Set(dinners).size).toBe(7);
      expect(dinners.filter((id) => fish.has(id)).length).toBeGreaterThanOrEqual(1);
      expect(dinners.filter((id) => chicken.has(id)).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("takes the minimums from the planning preferences", () => {
    const recipes = sample;
    const fish = new Set([recipes.salmon.recipeId, recipes.cod.recipeId]);
    const chicken = new Set([recipes.chickenCurry.recipeId, recipes.chickenWok.recipeId, recipes.roastChicken.recipeId]);

    for (let seed = 1; seed <= 50; seed += 1) {
      const dinners = generate({ random: seeded(seed), dinnerMinimums: { fish: 2, chicken: 3 } }).entries
        .filter((entry) => entry.slot === "Dinner")
        .map((entry) => mainRecipeId(entry)!);

      expect(dinners.filter((id) => fish.has(id)).length).toBe(2);
      expect(dinners.filter((id) => chicken.has(id)).length).toBe(3);
    }
  });

  it("applies the minimums to each week of a month", () => {
    const fishA = recipe("Fish A", 2, tag("Meal.Dinner"), tag("Protein.Fish"));
    const fishB = recipe("Fish B", 2, tag("Meal.Dinner"), tag("Protein.Fish"));
    const fishC = recipe("Fish C", 2, tag("Meal.Dinner"), tag("Protein.Fish"));
    const fishD = recipe("Fish D", 2, tag("Meal.Dinner"), tag("Protein.Fish"));
    const fishE = recipe("Fish E", 2, tag("Meal.Dinner"), tag("Protein.Fish"));
    const fishF = recipe("Fish F", 2, tag("Meal.Dinner"), tag("Protein.Fish"));
    const others = Array.from({ length: 30 }, (_, index) => recipe(`Other ${index}`, 2, tag("Meal.Dinner")));
    // Two full ISO weeks: Monday 30 November to Sunday 13 December 2026.
    const twoWeeks = [...getGenerationDates(new Date(2026, 10, 30), "week"), ...getGenerationDates(new Date(2026, 11, 7), "week")];
    const fish = new Set([fishA, fishB, fishC, fishD, fishE, fishF].map((item) => item.recipeId));

    for (let seed = 1; seed <= 20; seed += 1) {
      const dinners = generate({
        dates: twoWeeks,
        recipes: [fishA, fishB, fishC, fishD, fishE, fishF, ...others],
        dinnerMinimums: { fish: 2, chicken: 0 },
        random: seeded(seed),
      }).entries.filter((entry) => entry.slot === "Dinner");

      for (const weekStart of ["2026-11-30", "2026-12-07"]) {
        const weekEnd = weekStart === "2026-11-30" ? "2026-12-06" : "2026-12-13";
        const weekFish = dinners.filter((entry) => entry.date >= weekStart && entry.date <= weekEnd && fish.has(mainRecipeId(entry)!));
        expect(weekFish.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("counts dinners already planned towards the minimums and leaves their slots alone", () => {
    const recipes = sample;
    const existingEntries = [
      plannedEntry("2026-11-23", "Dinner", recipes.chickenCurry.recipeId),
      plannedEntry("2026-11-24", "Dinner", recipes.chickenWok.recipeId),
      plannedEntry("2026-11-25", "Dinner", recipes.salmon.recipeId),
      plannedEntry("2026-11-25", "Breakfast", recipes.porridge.recipeId),
    ];

    for (let seed = 1; seed <= 20; seed += 1) {
      const { entries } = generate({ existingEntries, random: seeded(seed) });
      const keys = entries.map(slotKey);

      expect(entries).toHaveLength(17);
      expect(keys).not.toContain("2026-11-23 Dinner");
      expect(keys).not.toContain("2026-11-25 Breakfast");

      const dinners = entries.filter((entry) => entry.slot === "Dinner").map((entry) => mainRecipeId(entry)!);
      // Recipes already planned for dinner are not picked again.
      expect(dinners).not.toContain(recipes.chickenCurry.recipeId);
      expect(dinners).not.toContain(recipes.chickenWok.recipeId);
      expect(dinners).not.toContain(recipes.salmon.recipeId);
    }
  });

  it("does not pick recipes that serve fewer people than are eating", () => {
    const small = recipe("Small dinner", 1, tag("Meal.Dinner"));
    const big = recipe("Big dinner", 3, tag("Meal.Dinner"));
    const { entries } = generate({ recipes: [small, big], dates: week.slice(0, 1), peopleEating: 3 });

    const dinner = entries.find((entry) => entry.slot === "Dinner");
    expect(mainRecipeId(dinner!)).toBe(big.recipeId);
    expect(dinner!.recipes[0].portions).toBe(3);
  });

  it("puts the leftovers of a large dinner into the next free lunch or dinner", () => {
    // Serves 4, two people eat: one dinner plus one leftover meal.
    const stew = recipe("Big stew", 4, tag("Meal.Dinner"));
    const { entries } = generate({ recipes: [stew], dates: week.slice(0, 3) });

    expect(entries.map(slotKey)).toEqual(["2026-11-23 Dinner", "2026-11-24 Lunch"]);
    expect(entries.every((entry) => mainRecipeId(entry) === stew.recipeId)).toBe(true);
  });

  it("adds a topping to bread breakfasts and uses at most two toppings in a week", () => {
    const toast = recipe("Toast", 2, tag("Meal.Breakfast"), tag("Format.Bread"));
    const toppings = ["Cheese", "Ham", "Jam", "Salami"].map((name) => ingredient(name, tag("FoodRole.Topping")));
    const notTopping = ingredient("Flour");

    for (let seed = 1; seed <= 20; seed += 1) {
      const { entries, issues } = generate({
        recipes: [toast],
        ingredients: [...toppings, notTopping],
        random: seeded(seed),
      });

      expect(issues.map((issue) => issue.code)).toEqual(["NoTaggedRecipes", "NoTaggedRecipes"]);
      expect(entries).toHaveLength(7);
      const toppingIds = new Set<number>();
      for (const entry of entries) {
        expect(entry.recipes).toHaveLength(2);
        const side = entry.recipes[1];
        expect(side).toMatchObject({ recipeId: null, role: "Side", sortOrder: 1, portions: null, amount: 50, unit: "Gram" });
        toppingIds.add(side.ingredientId!);
      }

      expect(toppingIds.size).toBeLessThanOrEqual(2);
      expect(toppingIds.has(notTopping.ingredientId)).toBe(false);
    }
  });

  it("does not add toppings to breakfasts that are not bread", () => {
    const porridge = recipe("Porridge", 2, tag("Meal.Breakfast"));
    const { entries } = generate({
      recipes: [porridge],
      ingredients: [ingredient("Cheese", tag("FoodRole.Topping"))],
      dates: week.slice(0, 2),
    });

    expect(entries.every((entry) => entry.recipes.length === 1)).toBe(true);
  });
});

describe("generation issues", () => {
  it("reports when every slot is already planned", () => {
    const recipes = sample;
    const existingEntries = (["Breakfast", "Lunch", "Dinner"] as const).map((slot) =>
      plannedEntry("2026-11-23", slot, recipes.pasta.recipeId),
    );

    const { entries, issues } = generate({ existingEntries, dates: week.slice(0, 1) });

    expect(entries).toEqual([]);
    expect(issues).toEqual([{ code: "NoEmptySlots" }]);
  });

  it("reports a missing system tag for each slot", () => {
    const { issues } = generate({ tagCategories: tagCategories(["Meal.Breakfast", "Meal.Lunch"]) });

    expect(issues).toEqual([{ code: "MissingSystemTag", slot: "Dinner", systemKey: "Meal.Dinner" }]);
  });

  it("reports a slot with no tagged recipes", () => {
    const { issues, entries } = generate({ recipes: [recipe("Only dinner", 2, tag("Meal.Dinner"))] });

    expect(issues).toEqual([
      { code: "NoTaggedRecipes", slot: "Breakfast", tagName: "Frokost" },
      { code: "NoTaggedRecipes", slot: "Lunch", tagName: "Lunsj" },
    ]);
    expect(entries.filter((entry) => entry.slot === "Dinner")).toHaveLength(1);
  });

  it("reports when no recipe serves enough people", () => {
    const { issues, entries } = generate({
      recipes: [recipe("Tiny lunch", 1, tag("Meal.Lunch"))],
      peopleEating: 2,
      tagCategories: tagCategories(["Meal.Breakfast", "Meal.Lunch", "Meal.Dinner"]),
    });

    expect(issues).toContainEqual({ code: "NoRecipeWithEnoughPortions", slot: "Lunch", tagName: "Lunsj", peopleEating: 2 });
    expect(entries).toEqual([]);
  });

  it("reports when every dinner recipe is already planned", () => {
    const pasta = recipe("Pasta", 2, tag("Meal.Dinner"));
    const { issues } = generate({
      recipes: [pasta],
      existingEntries: [plannedEntry("2026-11-23", "Dinner", pasta.recipeId)],
    });

    expect(issues).toContainEqual({ code: "NoAvailableDinnerRecipes" });
  });

  it("reports bread breakfasts without any topping ingredients", () => {
    const toast = recipe("Toast", 2, tag("Meal.Breakfast"), tag("Format.Bread"));
    const { issues } = generate({ recipes: [...Object.values(sample), toast], ingredients: [ingredient("Flour")] });

    expect(issues).toEqual([{ code: "NoToppingIngredients", tagName: "Pålegg" }]);
  });
});

describe("generateMealPlanEntries", () => {
  it("returns the entries without the issues and works without a random source", () => {
    const entries = generateMealPlanEntries({
      dates: week,
      existingEntries: [],
      ingredients: [],
      peopleEating: 2,
      recipes: Object.values(sample),
      tagCategories: tagCategories(),
    });

    expect(entries).toHaveLength(21);
  });
});

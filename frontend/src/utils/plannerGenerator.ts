import type { IIngredient, MeasurementUnit } from "../interfaces/IIngredient";
import type { IIngredientTagCategory } from "../interfaces/ILookup";
import type { IMealPlanEntry, MealSlot } from "../interfaces/IMeal";
import type { IRecipe } from "../interfaces/IRecipe";
import type { MealPlanEntryRequest, MealPlanRecipeRequest } from "../services/mealPlanService";
import { toDateInputValue } from "./plannerDate";

const generatedMealSlots: MealSlot[] = ["Breakfast", "Lunch", "Dinner"];
const slotSystemTags: Record<MealSlot, string | null> = {
  Breakfast: "Meal.Breakfast",
  Lunch: "Meal.Lunch",
  Dinner: "Meal.Dinner",
  Snack1: null,
  Snack2: null,
};
const dinnerProteinSystemTags = [
  "Protein.Fish",
  "Protein.Chicken",
  "Protein.Beef",
  "Protein.Lamb",
  "Protein.Mince",
] as const;
const dinnerMinimums: Partial<Record<(typeof dinnerProteinSystemTags)[number], number>> = {
  "Protein.Fish": 1,
  "Protein.Chicken": 2,
};
const toppingAmountGrams = 50;

type GenerateMealPlanEntriesArgs = {
  dates: Date[];
  existingEntries: IMealPlanEntry[];
  ingredients: IIngredient[];
  peopleEating: number;
  recipes: IRecipe[];
  tagCategories: IIngredientTagCategory[];
};

export function generateMealPlanEntries({
  dates,
  existingEntries,
  ingredients,
  peopleEating,
  recipes,
  tagCategories,
}: GenerateMealPlanEntriesArgs): MealPlanEntryRequest[] {
  const systemTags = buildSystemTagLookup(tagCategories);
  const filledSlots = new Set(existingEntries.map((entry) => getEntryKey(entry.date, entry.slot)));
  const selectedDinnerRecipeIds = getExistingDinnerRecipeIds(existingEntries);
  const dinnerProteinCounts = getExistingDinnerProteinCounts(existingEntries, recipes, systemTags);
  const toppingIngredients = ingredients.filter((ingredient) =>
    itemHasSystemTag(ingredient.tags, systemTags, "FoodRole.Topping"),
  );
  const toppingIdsByWeek = buildExistingToppingIdsByWeek(existingEntries, ingredients, systemTags);
  const generatedEntries: MealPlanEntryRequest[] = [];

  const targets = dates.flatMap((date) => {
    const dateKey = toDateInputValue(date);

    return generatedMealSlots
      .filter((slot) => !filledSlots.has(getEntryKey(dateKey, slot)))
      .map((slot) => ({ date, dateKey, slot }));
  });

  const availableTargetKeys = new Set(targets.map((target) => getEntryKey(target.dateKey, target.slot)));

  for (let targetIndex = 0; targetIndex < targets.length; targetIndex += 1) {
    const target = targets[targetIndex];
    const targetKey = getEntryKey(target.dateKey, target.slot);

    if (!availableTargetKeys.has(targetKey)) {
      continue;
    }

    const recipe = pickRecipeForSlot(
      recipes,
      target.slot,
      systemTags,
      selectedDinnerRecipeIds,
      dinnerProteinCounts,
      peopleEating,
    );

    if (recipe === undefined) {
      continue;
    }

    if (target.slot === "Dinner") {
      selectedDinnerRecipeIds.add(recipe.recipeId);
      const proteinKey = getDinnerProteinKey(recipe, systemTags);
      dinnerProteinCounts.set(proteinKey, (dinnerProteinCounts.get(proteinKey) ?? 0) + 1);
    }

    const placementCount = Math.floor(recipe.portions / peopleEating);
    const compatibleSlots = getCompatiblePlacementSlots(target.slot);
    let placedCount = 0;

    for (let placementIndex = targetIndex; placementIndex < targets.length; placementIndex += 1) {
      const placementTarget = targets[placementIndex];
      const placementKey = getEntryKey(placementTarget.dateKey, placementTarget.slot);

      if (!availableTargetKeys.has(placementKey) || !compatibleSlots.includes(placementTarget.slot)) {
        continue;
      }

      const plannedItems = createGeneratedMealItems(
        recipe,
        peopleEating,
        placementTarget,
        toppingIngredients,
        toppingIdsByWeek,
        systemTags,
      );

      generatedEntries.push({
        date: placementTarget.dateKey,
        slot: placementTarget.slot,
        notes: null,
        recipes: plannedItems,
      });
      availableTargetKeys.delete(placementKey);
      placedCount += 1;

      if (placedCount >= placementCount) {
        break;
      }
    }
  }

  return generatedEntries;
}

type GenerationTarget = {
  date: Date;
  dateKey: string;
  slot: MealSlot;
};

function pickRecipeForSlot(
  recipes: IRecipe[],
  slot: MealSlot,
  systemTags: SystemTagLookup,
  selectedDinnerRecipeIds: Set<number>,
  dinnerProteinCounts: Map<string, number>,
  peopleEating: number,
) {
  const candidates = getRecipeCandidatesForSlot(
    recipes,
    slot,
    systemTags,
    selectedDinnerRecipeIds,
    peopleEating,
  );

  if (slot !== "Dinner") {
    return pickRandomItem(candidates);
  }

  for (const proteinTag of Object.keys(dinnerMinimums) as (typeof dinnerProteinSystemTags)[number][]) {
    const targetCount = dinnerMinimums[proteinTag] ?? 0;
    if ((dinnerProteinCounts.get(proteinTag) ?? 0) >= targetCount) {
      continue;
    }

    const recipe = pickRandomItem(candidates.filter((candidate) =>
      itemHasSystemTag(candidate.tags, systemTags, proteinTag),
    ));
    if (recipe !== undefined) {
      return recipe;
    }
  }

  return pickDinnerVarietyRecipe(candidates, systemTags, dinnerProteinCounts);
}

function pickDinnerVarietyRecipe(
  candidates: IRecipe[],
  systemTags: SystemTagLookup,
  proteinCounts: Map<string, number>,
) {
  return shuffle(candidates)
    .sort((first, second) =>
      (proteinCounts.get(getDinnerProteinKey(first, systemTags)) ?? 0) -
      (proteinCounts.get(getDinnerProteinKey(second, systemTags)) ?? 0),
    )[0];
}

function getRecipeCandidatesForSlot(
  recipes: IRecipe[],
  slot: MealSlot,
  systemTags: SystemTagLookup,
  selectedDinnerRecipeIds: Set<number>,
  peopleEating: number,
) {
  const systemKey = slotSystemTags[slot];

  if (systemKey === null) {
    return [];
  }

  return recipes.filter((recipe) =>
    recipe.portions >= peopleEating &&
    (slot !== "Dinner" || !selectedDinnerRecipeIds.has(recipe.recipeId)) &&
    itemHasSystemTag(recipe.tags, systemTags, systemKey),
  );
}

function createGeneratedMealItems(
  recipe: IRecipe,
  peopleEating: number,
  target: GenerationTarget,
  toppingIngredients: IIngredient[],
  toppingIdsByWeek: Map<string, Set<number>>,
  systemTags: SystemTagLookup,
) {
  const plannedItems: MealPlanRecipeRequest[] = [
    {
      recipeId: recipe.recipeId,
      ingredientId: null,
      role: "Main" as const,
      sortOrder: 0,
      portions: peopleEating,
      amount: null,
      unit: null,
    },
  ];

  if (target.slot === "Breakfast" && itemHasSystemTag(recipe.tags, systemTags, "Format.Bread")) {
    const topping = pickToppingIngredient(target.date, toppingIngredients, toppingIdsByWeek);

    if (topping !== undefined) {
      plannedItems.push({
        recipeId: null,
        ingredientId: topping.ingredientId,
        role: "Side" as const,
        sortOrder: plannedItems.length,
        portions: null,
        amount: toppingAmountGrams,
        unit: "Gram" as MeasurementUnit,
      });
    }
  }

  return plannedItems;
}

function getCompatiblePlacementSlots(slot: MealSlot): MealSlot[] {
  if (slot === "Dinner") {
    return ["Lunch", "Dinner"];
  }

  return [slot];
}

function getDinnerProteinKey(recipe: IRecipe, systemTags: SystemTagLookup) {
  return dinnerProteinSystemTags.find((systemKey) => itemHasSystemTag(recipe.tags, systemTags, systemKey)) ?? "Other";
}

function pickToppingIngredient(
  date: Date,
  toppingIngredients: IIngredient[],
  toppingIdsByWeek: Map<string, Set<number>>,
) {
  if (toppingIngredients.length === 0) {
    return undefined;
  }

  const weekKey = getIsoWeekKey(date);
  const weekToppingIds = toppingIdsByWeek.get(weekKey) ?? new Set<number>();
  toppingIdsByWeek.set(weekKey, weekToppingIds);

  if (weekToppingIds.size >= 2) {
    const existingToppings = toppingIngredients.filter((ingredient) =>
      weekToppingIds.has(ingredient.ingredientId),
    );

    return pickRandomItem(existingToppings);
  }

  const newTopping = pickRandomItem(
    toppingIngredients.filter((ingredient) => !weekToppingIds.has(ingredient.ingredientId)),
  );

  if (newTopping === undefined) {
    return pickRandomItem(toppingIngredients);
  }

  weekToppingIds.add(newTopping.ingredientId);
  return newTopping;
}

function buildExistingToppingIdsByWeek(
  existingEntries: IMealPlanEntry[],
  ingredients: IIngredient[],
  systemTags: SystemTagLookup,
) {
  const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.ingredientId, ingredient]));
  const toppingIdsByWeek = new Map<string, Set<number>>();

  for (const entry of existingEntries) {
    const weekKey = getIsoWeekKey(new Date(`${entry.date}T00:00:00`));

    for (const plannedRecipe of entry.recipes) {
      if (plannedRecipe.ingredientId === null) {
        continue;
      }

      const ingredient = ingredientById.get(plannedRecipe.ingredientId);
      if (ingredient === undefined || !itemHasSystemTag(ingredient.tags, systemTags, "FoodRole.Topping")) {
        continue;
      }

      const weekToppingIds = toppingIdsByWeek.get(weekKey) ?? new Set<number>();
      weekToppingIds.add(ingredient.ingredientId);
      toppingIdsByWeek.set(weekKey, weekToppingIds);
    }
  }

  return toppingIdsByWeek;
}

function getExistingDinnerRecipeIds(existingEntries: IMealPlanEntry[]) {
  return new Set(
    existingEntries
      .filter((entry) => entry.slot === "Dinner")
      .flatMap((entry) =>
        entry.recipes
          .filter((plannedRecipe) => plannedRecipe.role === "Main")
          .map((plannedRecipe) => plannedRecipe.recipeId)
          .filter((recipeId): recipeId is number => recipeId !== null),
      ),
  );
}

function getExistingDinnerProteinCounts(
  existingEntries: IMealPlanEntry[],
  recipes: IRecipe[],
  systemTags: SystemTagLookup,
) {
  const recipeById = new Map(recipes.map((recipe) => [recipe.recipeId, recipe]));
  const proteinCounts = new Map<string, number>();

  for (const entry of existingEntries) {
    if (entry.slot !== "Dinner") {
      continue;
    }

    const mainRecipe = entry.recipes.find((plannedRecipe) =>
      plannedRecipe.role === "Main" && plannedRecipe.recipeId !== null,
    );
    if (mainRecipe?.recipeId === undefined || mainRecipe.recipeId === null) {
      continue;
    }

    const recipe = recipeById.get(mainRecipe.recipeId);
    if (recipe === undefined) {
      continue;
    }

    const proteinKey = getDinnerProteinKey(recipe, systemTags);
    proteinCounts.set(proteinKey, (proteinCounts.get(proteinKey) ?? 0) + 1);
  }

  return proteinCounts;
}

type SystemTagLookup = Map<string, string>;

function buildSystemTagLookup(categories: IIngredientTagCategory[]) {
  const systemTags = new Map<string, string>();

  for (const category of categories) {
    for (const tag of category.tags) {
      if (tag.systemKey !== null) {
        systemTags.set(tag.systemKey, tag.name);
      }
    }
  }

  return systemTags;
}

function itemHasSystemTag(tags: readonly string[], systemTags: SystemTagLookup, systemKey: string) {
  const tagName = systemTags.get(systemKey);
  return tagName !== undefined && tags.includes(tagName);
}

function getIsoWeekKey(date: Date) {
  const nextDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = nextDate.getUTCDay() || 7;
  nextDate.setUTCDate(nextDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(nextDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((nextDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return `${nextDate.getUTCFullYear()}-${week}`;
}

function getEntryKey(date: string, slot: MealSlot) {
  return `${date}::${slot}`;
}

function pickRandomItem<TItem>(items: TItem[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<TItem>(items: TItem[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

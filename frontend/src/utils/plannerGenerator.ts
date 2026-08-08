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
  recipes: IRecipe[];
  tagCategories: IIngredientTagCategory[];
};

export function generateMealPlanEntries({
  dates,
  existingEntries,
  ingredients,
  recipes,
  tagCategories,
}: GenerateMealPlanEntriesArgs): MealPlanEntryRequest[] {
  const systemTags = buildSystemTagLookup(tagCategories);
  const filledSlots = new Set(existingEntries.map((entry) => getEntryKey(entry.date, entry.slot)));
  const usedRecipeIds = new Set(
    existingEntries.flatMap((entry) =>
      entry.recipes
        .map((plannedRecipe) => plannedRecipe.recipeId)
        .filter((recipeId): recipeId is number => recipeId !== null),
    ),
  );
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

  const dinnerTargets = targets.filter((target) => target.slot === "Dinner");
  const dinnerSelections = chooseDinnerRecipes(
    dinnerTargets.length,
    recipes,
    systemTags,
    usedRecipeIds,
  );
  for (const recipe of dinnerSelections) {
    usedRecipeIds.add(recipe.recipeId);
  }
  let dinnerSelectionIndex = 0;

  for (const target of targets) {
    const recipe =
      target.slot === "Dinner"
        ? dinnerSelections[dinnerSelectionIndex++]
        : pickRandomRecipe(
            getRecipeCandidatesForSlot(recipes, target.slot, systemTags, usedRecipeIds),
          );

    if (recipe === undefined) {
      continue;
    }

    usedRecipeIds.add(recipe.recipeId);
    const plannedItems: MealPlanRecipeRequest[] = [
      {
        recipeId: recipe.recipeId,
        ingredientId: null,
        role: "Main" as const,
        sortOrder: 0,
        portions: recipe.portions,
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

    generatedEntries.push({
      date: target.dateKey,
      slot: target.slot,
      notes: null,
      recipes: plannedItems,
    });
  }

  return generatedEntries;
}

function chooseDinnerRecipes(
  count: number,
  recipes: IRecipe[],
  systemTags: SystemTagLookup,
  usedRecipeIds: Set<number>,
) {
  const selectedRecipes: IRecipe[] = [];
  const localUsedRecipeIds = new Set(usedRecipeIds);
  const dinnerCandidates = getRecipeCandidatesForSlot(recipes, "Dinner", systemTags, localUsedRecipeIds);

  for (const proteinTag of Object.keys(dinnerMinimums) as (typeof dinnerProteinSystemTags)[number][]) {
    const targetCount = dinnerMinimums[proteinTag] ?? 0;

    while (
      selectedRecipes.filter((recipe) => itemHasSystemTag(recipe.tags, systemTags, proteinTag)).length < targetCount &&
      selectedRecipes.length < count
    ) {
      const recipe = pickRandomRecipe(
        dinnerCandidates.filter((candidate) =>
          !localUsedRecipeIds.has(candidate.recipeId) &&
          itemHasSystemTag(candidate.tags, systemTags, proteinTag),
        ),
      );

      if (recipe === undefined) {
        break;
      }

      selectedRecipes.push(recipe);
      localUsedRecipeIds.add(recipe.recipeId);
    }
  }

  const proteinCounts = new Map<string, number>();
  for (const recipe of selectedRecipes) {
    const proteinKey = getDinnerProteinKey(recipe, systemTags);
    proteinCounts.set(proteinKey, (proteinCounts.get(proteinKey) ?? 0) + 1);
  }

  while (selectedRecipes.length < count) {
    const recipe = pickDinnerVarietyRecipe(dinnerCandidates, systemTags, localUsedRecipeIds, proteinCounts);

    if (recipe === undefined) {
      break;
    }

    selectedRecipes.push(recipe);
    localUsedRecipeIds.add(recipe.recipeId);
    const proteinKey = getDinnerProteinKey(recipe, systemTags);
    proteinCounts.set(proteinKey, (proteinCounts.get(proteinKey) ?? 0) + 1);
  }

  return selectedRecipes;
}

function pickDinnerVarietyRecipe(
  candidates: IRecipe[],
  systemTags: SystemTagLookup,
  usedRecipeIds: Set<number>,
  proteinCounts: Map<string, number>,
) {
  return shuffle(candidates.filter((candidate) => !usedRecipeIds.has(candidate.recipeId)))
    .sort((first, second) =>
      (proteinCounts.get(getDinnerProteinKey(first, systemTags)) ?? 0) -
      (proteinCounts.get(getDinnerProteinKey(second, systemTags)) ?? 0),
    )[0];
}

function getRecipeCandidatesForSlot(
  recipes: IRecipe[],
  slot: MealSlot,
  systemTags: SystemTagLookup,
  usedRecipeIds: Set<number>,
) {
  const systemKey = slotSystemTags[slot];

  if (systemKey === null) {
    return [];
  }

  return recipes.filter((recipe) =>
    !usedRecipeIds.has(recipe.recipeId) &&
    itemHasSystemTag(recipe.tags, systemTags, systemKey),
  );
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

    return pickRandomRecipe(existingToppings);
  }

  const newTopping = pickRandomRecipe(
    toppingIngredients.filter((ingredient) => !weekToppingIds.has(ingredient.ingredientId)),
  );

  if (newTopping === undefined) {
    return pickRandomRecipe(toppingIngredients);
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

function pickRandomRecipe<TItem>(items: TItem[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<TItem>(items: TItem[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

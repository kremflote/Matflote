import type { IngredientTag, MeasurementUnit } from "../interfaces/IIngredient";
import type { IMealPlanEntry } from "../interfaces/IMeal";
import type { IRecipe } from "../interfaces/IRecipe";

export type PrepHelperItem = {
  ingredientId: number;
  ingredientName: string;
  amount: number | null;
  unit: MeasurementUnit;
  actions: string[];
  sources: string[];
};

type PrepActionKey =
  | "chop"
  | "batons"
  | "crush"
  | "cube"
  | "dice"
  | "grate"
  | "julienne"
  | "mince"
  | "quarter"
  | "roughChop"
  | "shred"
  | "slice"
  | "wedge";

type PrepIngredientRow = {
  ingredientId: number;
  ingredientName: string;
  amount: number | null;
  unit: MeasurementUnit;
  actions: string[];
  sourceRecipe: string;
};

const prepIngredientTags: IngredientTag[] = ["Vegetable", "Fruit", "Herb", "LeafyGreen"];

const prepActionPatterns: Array<{
  key: PrepActionKey;
  patterns: RegExp[];
}> = [
  { key: "roughChop", patterns: [/\broughly chop\b/i, /\bgrovhakk/i] },
  { key: "mince", patterns: [/\bmince\b/i, /\bfinely chop\b/i, /\bfinhakk/i] },
  { key: "julienne", patterns: [/\bjulienne\b/i, /\bjulienned\b/i] },
  { key: "batons", patterns: [/\bbaton\b/i, /\bbatons\b/i, /\bbatonnet\b/i, /\bstaver\b/i] },
  { key: "crush", patterns: [/\bcrush\b/i, /\bknus/i] },
  { key: "shred", patterns: [/\bshred\b/i, /\bstriml/i] },
  { key: "quarter", patterns: [/\bquarter\b/i, /\bdelt i fire/i] },
  { key: "wedge", patterns: [/\bwedge\b/i, /\bbåt/i] },
  { key: "cube", patterns: [/\bcube\b/i, /\btern/i, /\bkutt i terning/i] },
  { key: "dice", patterns: [/\bdice\b/i, /\bfintern/i] },
  { key: "slice", patterns: [/\bslice\b/i, /\bskj[aæ]r\b/i, /\bskiv/i] },
  { key: "grate", patterns: [/\bgrate\b/i, /\briv\b/i] },
  { key: "chop", patterns: [/\bchop\b/i, /\bhakk/i] },
];

export function buildPrepHelperItems(
  mealPlanEntries: IMealPlanEntry[],
  recipesById: Map<number, IRecipe>,
  from: string,
  to: string,
  preparationLabels: Record<IRecipe["ingredients"][number]["preparation"], string>,
  actionLabels: Record<string, string>,
): PrepHelperItem[] {
  const prepRows = mealPlanEntries
    .filter((entry) => entry.date >= from && entry.date <= to)
    .flatMap((entry) =>
      entry.recipes.flatMap((mealPlanRecipe) => {
        if (mealPlanRecipe.recipeId === null) {
          return [];
        }

        const recipe = recipesById.get(mealPlanRecipe.recipeId);

        if (recipe === undefined) {
          return [];
        }

        const portionFactor = getPortionFactor(recipe, mealPlanRecipe.portions);

        return buildRecipePrepRows(
          recipe,
          recipe.name,
          recipe.name,
          recipesById,
          preparationLabels,
          actionLabels,
          new Set<number>(),
          portionFactor,
        );
      }),
    );

  return Array.from(
    prepRows
      .reduce((groups, row) => {
        const key = `${row.ingredientId}::${row.unit}::${row.actions.join(",")}`;
        const group = groups.get(key);

        if (group === undefined) {
          groups.set(key, {
            ...row,
            amount: row.amount,
            sourceRecipes: new Set([row.sourceRecipe]),
          });
          return groups;
        }

        group.amount = group.amount === null || row.amount === null
          ? null
          : group.amount + row.amount;
        row.actions.forEach((action) => {
          if (!group.actions.includes(action)) {
            group.actions.push(action);
          }
        });
        group.sourceRecipes.add(row.sourceRecipe);

        return groups;
      }, new Map<string, PrepIngredientRow & { sourceRecipes: Set<string> }>())
      .values(),
  )
    .filter((item) => item.actions.length > 0)
    .map((item) => ({
      ingredientId: item.ingredientId,
      ingredientName: item.ingredientName,
      amount: item.amount,
      unit: item.unit,
      actions: item.actions,
      sources: Array.from(item.sourceRecipes).sort((left, right) => left.localeCompare(right)),
    }))
    .sort((left, right) => left.ingredientName.localeCompare(right.ingredientName));
}

function buildRecipePrepRows(
  recipe: IRecipe,
  rootRecipeName: string,
  sourceRecipeName: string,
  recipesById: Map<number, IRecipe>,
  preparationLabels: Record<IRecipe["ingredients"][number]["preparation"], string>,
  actionLabels: Record<string, string>,
  visitedRecipeIds: Set<number>,
  portionFactor: number,
): PrepIngredientRow[] {
  if (visitedRecipeIds.has(recipe.recipeId)) {
    return [];
  }

  visitedRecipeIds.add(recipe.recipeId);

  const directRows = recipe.ingredients
    .filter((recipeIngredient) => shouldPrepIngredient(recipeIngredient.ingredient.tags))
    .map((recipeIngredient): PrepIngredientRow => ({
      ingredientId: recipeIngredient.ingredient.ingredientId,
      ingredientName: recipeIngredient.ingredient.ingredientName,
      amount: recipeIngredient.amount === null ? null : recipeIngredient.amount * portionFactor,
      unit: recipeIngredient.unit,
      actions: recipeIngredient.preparation === "None"
        ? inferPrepActions(recipe.instructions, recipeIngredient.ingredient.ingredientName)
            .map((actionKey) => actionLabels[actionKey] ?? actionKey)
        : [preparationLabels[recipeIngredient.preparation]],
      sourceRecipe: sourceRecipeName,
    }));

  const componentRows = recipe.components.flatMap((component) => {
    const componentRecipe = recipesById.get(component.recipeId);
    if (componentRecipe === undefined) {
      return [];
    }

    return buildRecipePrepRows(
      componentRecipe,
      rootRecipeName,
      `${componentRecipe.name} via ${rootRecipeName}`,
      recipesById,
      preparationLabels,
      actionLabels,
      visitedRecipeIds,
      portionFactor * getComponentScale(component.amount, component.unit, componentRecipe),
    );
  });

  visitedRecipeIds.delete(recipe.recipeId);
  return [...directRows, ...componentRows];
}

function getPortionFactor(recipe: IRecipe, selectedPortions: number | null) {
  const basePortions = recipe.portions > 0 ? recipe.portions : 1;
  const portions = selectedPortions !== null && selectedPortions > 0 ? selectedPortions : basePortions;
  return portions / basePortions;
}

function getComponentScale(amount: number, unit: MeasurementUnit, childRecipe: IRecipe) {
  const componentBaseAmount = toBaseAmount(amount, unit);
  const childBaseAmount = getRecipeBaseAmount(childRecipe, unit);

  return componentBaseAmount === null || childBaseAmount === null || childBaseAmount <= 0
    ? 1
    : componentBaseAmount / childBaseAmount;
}

function getRecipeBaseAmount(recipe: IRecipe, targetUnit: MeasurementUnit) {
  const targetFamily = getMeasurementFamily(targetUnit);
  if (targetFamily === null) {
    return null;
  }

  const total = recipe.ingredients.reduce((sum, recipeIngredient) => {
    if (getMeasurementFamily(recipeIngredient.unit) !== targetFamily) {
      return sum;
    }

    const baseAmount = toBaseAmount(recipeIngredient.amount, recipeIngredient.unit);
    return baseAmount === null ? sum : sum + baseAmount;
  }, 0);

  return total > 0 ? total : null;
}

function toBaseAmount(amount: number | null, unit: MeasurementUnit) {
  if (amount === null) {
    return null;
  }

  if (unit === "Gram" || unit === "Milliliter") {
    return amount;
  }

  if (unit === "Kilogram" || unit === "Liter") {
    return amount * 1000;
  }

  return null;
}

function getMeasurementFamily(unit: MeasurementUnit) {
  if (unit === "Gram" || unit === "Kilogram") {
    return "mass";
  }

  if (unit === "Milliliter" || unit === "Liter") {
    return "volume";
  }

  return null;
}

function shouldPrepIngredient(tags: IngredientTag[]) {
  return prepIngredientTags.some((tag) => tags.includes(tag));
}

function inferPrepActions(instructions: string | null, ingredientName: string): PrepActionKey[] {
  if (instructions === null || instructions.trim().length === 0) {
    return [];
  }

  const relevantText = getRelevantInstructionText(instructions, ingredientName);

  return prepActionPatterns
    .filter((action) => action.patterns.some((pattern) => pattern.test(relevantText)))
    .map((action) => action.key);
}

function getRelevantInstructionText(instructions: string, ingredientName: string) {
  const ingredientTerms = ingredientName
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2);
  const sentences = instructions
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const matchingSentences = sentences.filter((sentence) => {
    const lowerSentence = sentence.toLowerCase();
    return ingredientTerms.some((term) => lowerSentence.includes(term));
  });

  return matchingSentences.length > 0
    ? matchingSentences.join(" ")
    : instructions;
}

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
        const recipe = recipesById.get(mealPlanRecipe.recipeId);

        if (recipe === undefined) {
          return [];
        }

        return recipe.ingredients
          .filter((recipeIngredient) => shouldPrepIngredient(recipeIngredient.ingredient.tags))
          .map((recipeIngredient): PrepIngredientRow => ({
            ingredientId: recipeIngredient.ingredient.ingredientId,
            ingredientName: recipeIngredient.ingredient.ingredientName,
            amount: recipeIngredient.amount,
            unit: recipeIngredient.unit,
            actions: recipeIngredient.preparation === "None"
              ? inferPrepActions(recipe.instructions, recipeIngredient.ingredient.ingredientName)
                  .map((actionKey) => actionLabels[actionKey] ?? actionKey)
              : [preparationLabels[recipeIngredient.preparation]],
            sourceRecipe: recipe.name,
          }));
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

import type { IIngredientTagCategory, IIngredientTagDefinition } from "../interfaces/ILookup";

export function getTagName(tag: IIngredientTagDefinition | string) {
  return typeof tag === "string" ? tag : tag.name;
}

export function getCategoryTagNames(category: Pick<IIngredientTagCategory, "tags">) {
  return category.tags.map(getTagName);
}

export function getAllCategoryTagNames(categories: readonly Pick<IIngredientTagCategory, "tags">[]) {
  return categories.flatMap(getCategoryTagNames);
}

export function getIngredientVisibleTagCategories(categories: readonly IIngredientTagCategory[]) {
  return categories.filter((category) => category.showForIngredients !== false);
}

export function getRecipeVisibleTagCategories(categories: readonly IIngredientTagCategory[]) {
  return categories.filter((category) => category.showForRecipes !== false);
}

/**
 * System keys of the tags behaviour depends on. Tags can be renamed, so code looks a tag up by its key and
 * only falls back to the default English name when no tag carries the key.
 */
export const systemTagKeys = {
  vegetable: "Produce.Vegetable",
  fruit: "Produce.Fruit",
  herb: "Produce.Herb",
  leafyGreen: "Produce.LeafyGreen",
  spice: "Food.Spice",
  sauce: "FoodRole.Sauce",
  dip: "FoodRole.Dip",
  side: "FoodRole.Side",
  salad: "FoodRole.Salad",
} as const;

const systemTagDefaultNames: Record<string, string> = {
  [systemTagKeys.vegetable]: "Vegetable",
  [systemTagKeys.fruit]: "Fruit",
  [systemTagKeys.herb]: "Herb",
  [systemTagKeys.leafyGreen]: "LeafyGreen",
  [systemTagKeys.spice]: "Spice",
  [systemTagKeys.sauce]: "Sauce",
  [systemTagKeys.dip]: "Dip",
  [systemTagKeys.side]: "Side",
  [systemTagKeys.salad]: "Salad",
};

/** Tag name by system key. */
export function buildSystemTagNameLookup(categories: readonly Pick<IIngredientTagCategory, "tags">[]) {
  const systemTagNames = new Map<string, string>();

  for (const category of categories) {
    for (const tag of category.tags) {
      if (tag.systemKey !== null) {
        systemTagNames.set(tag.systemKey, tag.name);
      }
    }
  }

  return systemTagNames;
}

/** The current name of the tag with this key, or its default name when no tag has the key. */
export function getSystemTagName(systemTagNames: ReadonlyMap<string, string>, systemKey: string) {
  return systemTagNames.get(systemKey) ?? systemTagDefaultNames[systemKey] ?? systemKey;
}

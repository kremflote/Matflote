import type { IngredientTag, KnownIngredientTag, MeasurementUnit, Vitamin } from "../../interfaces/IIngredient";
import type { IIngredientTagCategory, IRecipeTagCategory } from "../../interfaces/ILookup";
import type { DessertType, IngredientPreparation, RecipeTag, RecipeType } from "../../interfaces/IRecipe";

export const recipeTypes: RecipeType[] = [
  "Dish",
  "Dessert",
  "Sauce",
  "Dip",
  "Side",
  "SpiceMix",
];

export const recipeTags: RecipeTag[] = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Bowl",
  "Plate",
  "Porridge",
  "Grill",
  "Pasta",
  "Vegetarian",
  "Soup",
  "Stew",
  "Salad",
  "Pizza",
  "Sandwich",
  "Casserole",
  "SousVide",
];

export type RecipeTagGroupKey = "meal" | "format" | "style";

export const recipeTagGroups: Array<{
  key: RecipeTagGroupKey;
  values: RecipeTag[];
}> = [
  {
    key: "meal",
    values: ["Breakfast", "Lunch", "Dinner"],
  },
  {
    key: "format",
    values: ["Bowl", "Plate", "Porridge", "Soup", "Stew", "Salad", "Pizza", "Sandwich", "Casserole"],
  },
  {
    key: "style",
    values: ["Grill", "Pasta", "Vegetarian", "SousVide"],
  },
];

export function getRecipeTagGroupsWithCustomTags(
  customTags: readonly RecipeTag[],
  fallbackGroup: RecipeTagGroupKey = "style",
  categories: readonly IRecipeTagCategory[] = [],
) {
  const baseGroups = categories.length === 0
    ? recipeTagGroups
    : categories.map((category) => ({
        key: category.recipeTagCategoryId.toString(),
        values: category.tags as RecipeTag[],
      }));
  const styleCategory = categories.find((category) => category.name.trim().toLowerCase() === "style");
  const fallbackKey = categories.length === 0
    ? fallbackGroup
    : styleCategory?.recipeTagCategoryId.toString() ?? categories[0]?.recipeTagCategoryId.toString() ?? fallbackGroup;
  const knownTags = new Set(baseGroups.flatMap((group) => group.values));
  const normalizedCustomTags = customTags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0 && !knownTags.has(tag));

  if (normalizedCustomTags.length === 0) {
    return baseGroups;
  }

  return baseGroups.map((group) =>
    group.key === fallbackKey
      ? {
          ...group,
          values: [...group.values, ...Array.from(new Set(normalizedCustomTags))],
        }
      : group,
  );
}

export function formatRecipeTagCategoryName(
  name: string,
  localizedNames: Record<string, string>,
) {
  const normalizedName = name.trim().toLowerCase();
  if (normalizedName === "meal") {
    return localizedNames.meal ?? name;
  }

  if (normalizedName === "format") {
    return localizedNames.format ?? name;
  }

  if (normalizedName === "style") {
    return localizedNames.style ?? name;
  }

  return name;
}

export const dessertTypes: DessertType[] = [
  "Cake",
  "Pastry",
  "IceCream",
  "Pudding",
  "Cookie",
  "Pie",
  "Tart",
  "Chocolate",
  "FruitDessert",
  "Other",
];

export const ingredientTags: KnownIngredientTag[] = [
  "Vegetable",
  "Fruit",
  "Chicken",
  "Fish",
  "Beef",
  "Lamb",
  "Mince",
  "Dairy",
  "Grain",
  "Spice",
  "Herb",
  "Sauce",
  "Pantry",
  "Frozen",
  "LeafyGreen",
  "Berry",
  "RootVegetable",
  "Bread",
  "Dip",
];

export type IngredientTagGroupKey = string;

export const ingredientTagGroups: Array<{
  key: IngredientTagGroupKey;
  values: IngredientTag[];
}> = [
  {
    key: "produce",
    values: ["Vegetable", "Fruit", "Berry", "RootVegetable", "LeafyGreen", "Herb"],
  },
  {
    key: "protein",
    values: ["Chicken", "Fish", "Beef", "Lamb", "Mince", "Dairy"],
  },
  {
    key: "pantry",
    values: ["Grain", "Bread", "Spice", "Sauce", "Dip", "Pantry", "Frozen"],
  },
];

export function getIngredientTagGroupsWithCustomTags(
  customTags: readonly IngredientTag[],
  fallbackGroup: IngredientTagGroupKey = "pantry",
  categories: readonly IIngredientTagCategory[] = [],
) {
  const baseGroups = categories.length === 0
    ? ingredientTagGroups
    : categories.map((category) => ({
        key: category.ingredientTagCategoryId.toString(),
        values: category.tags as IngredientTag[],
      }));
  const pantryCategory = categories.find((category) => category.name.trim().toLowerCase() === "pantry");
  const fallbackKey = categories.length === 0
    ? fallbackGroup
    : pantryCategory?.ingredientTagCategoryId.toString() ?? categories[0]?.ingredientTagCategoryId.toString() ?? fallbackGroup;
  const knownTags = new Set(baseGroups.flatMap((group) => group.values));
  const normalizedCustomTags = customTags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0 && !knownTags.has(tag));

  if (normalizedCustomTags.length === 0) {
    return baseGroups;
  }

  return baseGroups.map((group) =>
    group.key === fallbackKey
      ? {
          ...group,
          values: [...group.values, ...Array.from(new Set(normalizedCustomTags))],
        }
      : group,
  );
}

export function normalizeCustomTagName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 64);
}

export function formatIngredientTagCategoryName(
  name: string,
  localizedNames: Record<string, string>,
) {
  const normalizedName = name.trim().toLowerCase();
  if (normalizedName === "produce") {
    return localizedNames.produce ?? name;
  }

  if (normalizedName === "protein") {
    return localizedNames.protein ?? name;
  }

  if (normalizedName === "pantry") {
    return localizedNames.pantry ?? name;
  }

  return name;
}

export const measurementUnits: MeasurementUnit[] = [
  "Gram",
  "Kilogram",
  "Milliliter",
  "Liter",
];

export const ingredientPreparations: IngredientPreparation[] = [
  "None",
  "Quartered",
  "Wedged",
  "Chopped",
  "RoughlyChopped",
  "FinelyChopped",
  "Diced",
  "Cubed",
  "Julienned",
  "Batons",
  "Sliced",
  "Minced",
  "Grated",
  "Shredded",
  "Crushed",
];

export const vitamins: Vitamin[] = [
  "VitaminA",
  "VitaminB9",
  "VitaminB12",
  "VitaminC",
  "VitaminD",
  "VitaminE",
  "VitaminK",
  "Choline",
];

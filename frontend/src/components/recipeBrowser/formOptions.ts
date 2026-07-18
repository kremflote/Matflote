import type { IngredientTag, KnownIngredientTag, MeasurementUnit, Vitamin } from "../../interfaces/IIngredient";
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

export type IngredientTagGroupKey = "produce" | "protein" | "pantry";

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
) {
  const knownTags = new Set(ingredientTagGroups.flatMap((group) => group.values));
  const normalizedCustomTags = customTags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0 && !knownTags.has(tag));

  if (normalizedCustomTags.length === 0) {
    return ingredientTagGroups;
  }

  return ingredientTagGroups.map((group) =>
    group.key === fallbackGroup
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

export const measurementUnits: MeasurementUnit[] = [
  "Gram",
  "Kilogram",
  "Milliliter",
  "Liter",
  "Teaspoon",
  "Tablespoon",
  "Cup",
  "Piece",
  "Clove",
  "Pinch",
  "ToTaste",
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
  "VitaminB",
  "VitaminB12",
  "VitaminC",
  "VitaminD",
  "VitaminE",
  "VitaminK",
];

import type { IngredientTag, MeasurementUnit, Vitamin } from "../../interfaces/IIngredient";
import type { DessertType, RecipeTag, RecipeType } from "../../interfaces/IRecipe";

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
  "Grill",
  "Pasta",
  "Vegetarian",
  "Soup",
  "Stew",
  "Salad",
  "Pizza",
  "Sandwich",
  "Taco",
  "Curry",
  "Casserole",
  "Other",
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

export const ingredientTags: IngredientTag[] = [
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
  "Other",
  "LeafyGreen",
];

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

export const vitamins: Vitamin[] = [
  "VitaminA",
  "VitaminB",
  "VitaminB12",
  "VitaminC",
  "VitaminD",
  "VitaminE",
  "VitaminK",
];

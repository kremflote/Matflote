import type { IIngredient, MeasurementUnit } from "./IIngredient";
import type { ICuisine } from "./ILookup";

export interface IRecipe {
  recipeId: number;
  recipeType: RecipeType;
  name: string;
  imageUrl: string | null;
  description: string | null;
  instructions: string | null;
  ingredients: IRecipeIngredient[];
  tags: RecipeTag[];
  cuisineId: number | null;
  cuisine: ICuisine | null;
  dessertType: DessertType | null;
}

export interface IRecipeIngredient {
  recipeIngredientId: number;
  ingredient: IIngredient;
  amount: number | null;
  unit: MeasurementUnit;
  preparation: IngredientPreparation;
}

export type IngredientPreparation =
  | "None"
  | "Quartered"
  | "Wedged"
  | "Chopped"
  | "RoughlyChopped"
  | "FinelyChopped"
  | "Diced"
  | "Cubed"
  | "Julienned"
  | "Batons"
  | "Sliced"
  | "Minced"
  | "Grated"
  | "Shredded"
  | "Crushed";

export type RecipeType =
  | "Dish"
  | "Dessert"
  | "Sauce"
  | "Dip"
  | "Side"
  | "SpiceMix";

export type RecipeTag =
  | "Breakfast"
  | "Lunch"
  | "Dinner"
  | "Bowl"
  | "Grill"
  | "Pasta"
  | "Vegetarian"
  | "Soup"
  | "Stew"
  | "Salad"
  | "Pizza"
  | "Sandwich"
  | "Casserole"
  | "Porridge"
  | "Plate"
  | "SousVide";

export type DessertType =
  | "Cake"
  | "Pastry"
  | "IceCream"
  | "Pudding"
  | "Cookie"
  | "Pie"
  | "Tart"
  | "Chocolate"
  | "FruitDessert"
  | "Other";

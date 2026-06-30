import type { IRecipe } from "./IRecipe";

export interface IDish extends IRecipe {
  types: DishType[];
  cuisine: Cuisine;
}

export type DishType =
  | "Bowl"
  | "Grill"
  | "Pasta"
  | "Vegetarian"
  | "Soup"
  | "Stew"
  | "Salad"
  | "Pizza"
  | "Sandwich"
  | "Taco"
  | "Curry"
  | "Casserole"
  | "Other";

export type Cuisine =
  | "Asian"
  | "Indian"
  | "Mediterranean"
  | "French"
  | "Norwegian"
  | "Mexican"
  | "Italian"
  | "Grill"
  | "Other";

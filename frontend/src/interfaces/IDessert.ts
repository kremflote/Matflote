import type { IRecipe } from "./IRecipe";

export interface IDessert extends IRecipe {
  type: DessertType;
}

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

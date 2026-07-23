import type { IIngredient, MeasurementUnit } from "./IIngredient";

export interface IRecipe {
  recipeId: number;
  recipeType: RecipeType;
  name: string;
  imageUrl: string | null;
  description: string | null;
  instructions: string | null;
  portions: number;
  ingredients: IRecipeIngredient[];
  tags: RecipeTag[];
  components: IRecipeComponent[];
  dessertType: DessertType | null;
}

export interface IRecipeComponent {
  recipeId: number;
  recipeType: RecipeType;
  name: string;
  imageUrl: string | null;
  amount: number;
  unit: MeasurementUnit;
  preparation: IngredientPreparation;
  sortOrder: number;
  ingredients?: IRecipeIngredient[];
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

export type KnownRecipeTag =
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

export type RecipeTag = KnownRecipeTag | (string & {});

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

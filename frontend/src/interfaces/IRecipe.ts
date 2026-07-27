import type { IIngredient, MeasurementUnit } from "./IIngredient";

export interface IRecipe {
  recipeId: number;
  name: string;
  imageUrl: string | null;
  description: string | null;
  instructions: string | null;
  portions: number;
  ingredients: IRecipeIngredient[];
  tags: RecipeTag[];
  components: IRecipeComponent[];
}

export interface IRecipeComponent {
  recipeId: number;
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

export type KnownRecipeTag =
  | "Vegetable"
  | "Fruit"
  | "Chicken"
  | "Fish"
  | "Beef"
  | "Lamb"
  | "Mince"
  | "Dairy"
  | "Grain"
  | "Spice"
  | "Herb"
  | "Sauce"
  | "Frozen"
  | "LeafyGreen"
  | "Berry"
  | "RootVegetable"
  | "Bread"
  | "Dip"
  | "Breakfast"
  | "Lunch"
  | "Dinner"
  | "Dish"
  | "Side"
  | "Dessert"
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
  | "SousVide"
  | "SpiceMix";

export type RecipeTag = KnownRecipeTag | (string & {});

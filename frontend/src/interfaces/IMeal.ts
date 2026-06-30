export interface IMealPlanEntry {
  mealPlanEntryId: number;
  date: string;
  slot: MealSlot;
  notes: string | null;
  recipes: IMealPlanRecipe[];
}

export interface IMealPlanRecipe {
  mealPlanRecipeId: number;
  recipeId: number;
  role: MealRecipeRole;
  sortOrder: number;
}

export type MealSlot = "Breakfast" | "Lunch" | "Dinner" | "Snack1" | "Snack2";

export type MealRecipeRole = "Main" | "Sauce" | "Side" | "Extra";

export interface IWeeklyPrepSummary {
  vegetables: IIngredientPrepItem[];
  shoppingList: IIngredientPrepItem[];
}

export interface IIngredientPrepItem {
  ingredientId: number;
  amount: number | null;
}
